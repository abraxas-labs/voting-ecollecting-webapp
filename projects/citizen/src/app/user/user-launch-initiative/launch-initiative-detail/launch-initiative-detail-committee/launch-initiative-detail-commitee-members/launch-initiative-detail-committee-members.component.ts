/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import {
  ButtonModule,
  CardModule,
  DialogService,
  IconButtonModule,
  IconModule,
  SpinnerModule,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { Initiative, InitiativeCommittee, InitiativeCommitteeMember } from '../../../../../core/models/initiative.model';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import {
  LaunchInitiativeDetailCommitteeMembersDialogComponent,
  LaunchInitiativeDetailCommitteeMembersDialogData,
} from '../launch-initiative-detail-commitee-members-dialog/launch-initiative-detail-committee-members-dialog.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData, DomainOfInfluence, ToastService } from 'ecollecting-lib';
import { InitiativeService } from '../../../../../core/services/initiative.service';
import { DomainOfInfluenceType, InitiativeCommitteeMemberApprovalState } from '@abraxas/voting-ecollecting-proto';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DomainOfInfluenceService } from '../../../../../core/services/domain-of-influence.service';

@Component({
  selector: 'app-launch-initiative-detail-committee-members',
  imports: [
    ButtonModule,
    TranslatePipe,
    TableModule,
    IconModule,
    CardModule,
    IconButtonModule,
    SpinnerModule,
    TruncateWithTooltipModule,
    StatusLabelModule,
    TranslateDirective,
    DatePipe,
    DecimalPipe,
    CdkDropList,
    CdkDrag,
    CdkDragPreview,
  ],
  templateUrl: './launch-initiative-detail-committee-members.component.html',
  styleUrl: './launch-initiative-detail-committee-members.component.scss',
})
export class LaunchInitiativeDetailCommitteeMembersComponent implements OnChanges, OnInit {
  private readonly dialogService = inject(DialogService);
  private readonly initiativeService = inject(InitiativeService);
  private readonly toast = inject(ToastService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  protected readonly approvalStates = InitiativeCommitteeMemberApprovalState;

  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;

  protected readonly lastNameColumn = 'lastName';
  protected readonly firstNameColumn = 'firstName';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly residenceColumn = 'residence';
  protected readonly emailColumn = 'email';
  protected readonly signatureTypeColumn = 'signatureType';
  protected readonly stateColumn = 'state';
  protected readonly actionsColumn = 'actions';
  protected readonly columns = [
    this.lastNameColumn,
    this.firstNameColumn,
    this.dateOfBirthColumn,
    this.residenceColumn,
    this.emailColumn,
    this.signatureTypeColumn,
    this.stateColumn,
    this.actionsColumn,
  ];

  protected dataSource = new TableDataSource<InitiativeCommitteeMember>();
  protected domainOfInfluences?: DomainOfInfluence[];

  public async ngOnInit(): Promise<void> {
    this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]);
  }

  public ngOnChanges(): void {
    this.dataSource.data = this.committee.committeeMembers;
  }

  public add(): void {
    this.dialogService.open(LaunchInitiativeDetailCommitteeMembersDialogComponent, {
      initiative: this.initiative,
      domainOfInfluences: this.domainOfInfluences ?? [],
      onSave: member => this.addMember(member),
    } satisfies LaunchInitiativeDetailCommitteeMembersDialogData);
  }

  public async edit(member: InitiativeCommitteeMember): Promise<void> {
    const oldApprovalState = member.approvalState;
    this.dialogService.open(LaunchInitiativeDetailCommitteeMembersDialogComponent, {
      member,
      initiative: this.initiative,
      domainOfInfluences: this.domainOfInfluences ?? [],
      onSave: m => this.editMember(m, oldApprovalState),
    } satisfies LaunchInitiativeDetailCommitteeMembersDialogData);
  }

  public async resend(member: InitiativeCommitteeMember): Promise<void> {
    await this.initiativeService.resendCommitteeMemberInvitation(this.initiative.id, member.id);
    this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REQUEST_MEMBER_SIGNATURE.RESEND_SUCCESS');
  }

  public async remove(member: InitiativeCommitteeMember): Promise<void> {
    if (!(await this.confirmRemove())) {
      return;
    }

    await this.initiativeService.deleteCommitteeMember(this.initiative.id, member.id);
    this.dataSource.data = this.committee.committeeMembers = this.committee.committeeMembers.filter(m => m.id !== member.id);
    this.toast.success('APP.DELETED');

    if (
      member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED ||
      member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED
    ) {
      this.updateApprovedMembersCount(this.committee, -1);
    }

    this.committee.totalMembersCount--;
  }

  public async sort(data: CdkDragDrop<InitiativeCommitteeMember, InitiativeCommitteeMember, InitiativeCommitteeMember>): Promise<void> {
    if (data.previousIndex === data.currentIndex) {
      return;
    }

    moveItemInArray(this.committee.committeeMembers, data.previousIndex, data.currentIndex);
    this.committee.committeeMembers = this.dataSource.data = [...this.committee.committeeMembers];
    await this.initiativeService.updateCommitteeMemberSort(this.initiative.id, data.item.data.id, data.currentIndex);
    this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.SORTED');
  }

  private addMember(member: InitiativeCommitteeMember) {
    this.dataSource.data = this.committee.committeeMembers = [...this.committee.committeeMembers, member];
    this.committee.totalMembersCount++;

    if (member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED) {
      this.updateApprovedMembersCount(this.committee, 1);
    }
  }

  private editMember(member: InitiativeCommitteeMember, oldApprovalState: InitiativeCommitteeMemberApprovalState) {
    if (oldApprovalState === member.approvalState) {
      return;
    }

    if (member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED) {
      this.updateApprovedMembersCount(this.committee, 1);
    }

    if (member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED) {
      this.updateApprovedMembersCount(this.committee, -1);
    }
  }

  private async confirmRemove(): Promise<boolean> {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REMOVE_CONFIRMATION.TITLE',
      message: 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REMOVE_CONFIRMATION.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    return firstValueFrom(dialogRef.afterClosed());
  }

  private updateApprovedMembersCount(committee: InitiativeCommittee, delta: number): void {
    committee.approvedMembersCount = committee.approvedMembersCount + delta;
    committee.approvedMembersCountOk = committee.approvedMembersCount >= committee.requiredApprovedMembersCount;
  }
}
