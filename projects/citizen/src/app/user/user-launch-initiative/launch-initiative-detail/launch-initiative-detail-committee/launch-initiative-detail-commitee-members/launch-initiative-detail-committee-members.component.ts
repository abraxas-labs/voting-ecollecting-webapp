/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input, OnInit } from '@angular/core';
import { ButtonModule, CardModule, DialogService, IconModule, SpinnerModule } from '@abraxas/base-components';
import { Initiative, InitiativeCommittee, InitiativeCommitteeMember } from '../../../../../core/models/initiative.model';
import { TranslatePipe } from '@ngx-translate/core';
import {
  LaunchInitiativeDetailCommitteeMembersDialogComponent,
  LaunchInitiativeDetailCommitteeMembersDialogData,
} from '../launch-initiative-detail-commitee-members-dialog/launch-initiative-detail-committee-members-dialog.component';
import { DecimalPipe } from '@angular/common';
import { ConfirmDialogService, DomainOfInfluence, ToastService } from 'ecollecting-lib';
import { InitiativeService } from '../../../../../core/services/initiative.service';
import { DomainOfInfluenceType, InitiativeCommitteeMemberApprovalState } from '@abraxas/voting-ecollecting-proto';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DomainOfInfluenceService } from '../../../../../core/services/domain-of-influence.service';
import { LaunchInitiativeDetailCommitteeMembersTableComponent } from '../launch-initiative-detail-committee-members-table/launch-initiative-detail-committee-members-table.component';

@Component({
  selector: 'app-launch-initiative-detail-committee-members',
  imports: [
    CardModule,
    SpinnerModule,
    TranslatePipe,
    LaunchInitiativeDetailCommitteeMembersTableComponent,
    IconModule,
    DecimalPipe,
    ButtonModule,
  ],
  templateUrl: './launch-initiative-detail-committee-members.component.html',
  styleUrl: './launch-initiative-detail-committee-members.component.scss',
})
export class LaunchInitiativeDetailCommitteeMembersComponent implements OnInit {
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly initiativeService = inject(InitiativeService);
  private readonly toast = inject(ToastService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;

  protected domainOfInfluences?: DomainOfInfluence[];

  public async ngOnInit(): Promise<void> {
    this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]);
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
    member.approvalState = InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED;
    this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REQUEST_MEMBER_SIGNATURE.RESEND_SUCCESS');
    if (this.committee.activeCommitteeMembers.filter(m => m.id === member.id).length === 1) {
      return;
    }

    const memberToMove = this.committee.rejectedOrExpiredCommitteeMembers.find(m => m.id === member.id);
    if (!memberToMove) {
      return;
    }

    this.committee.rejectedOrExpiredCommitteeMembers = this.committee.rejectedOrExpiredCommitteeMembers.filter(m => m.id !== member.id);
    this.committee.activeCommitteeMembers = [...this.committee.activeCommitteeMembers, memberToMove];
  }

  public async remove(member: InitiativeCommitteeMember): Promise<void> {
    if (!(await this.confirmRemove())) {
      return;
    }

    await this.initiativeService.deleteCommitteeMember(this.initiative.id, member.id);
    this.committee.activeCommitteeMembers = this.committee.activeCommitteeMembers.filter(m => m.id !== member.id);
    this.committee.rejectedOrExpiredCommitteeMembers = this.committee.rejectedOrExpiredCommitteeMembers.filter(m => m.id !== member.id);
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

    moveItemInArray(this.committee.activeCommitteeMembers, data.previousIndex, data.currentIndex);
    this.committee.activeCommitteeMembers = [...this.committee.activeCommitteeMembers];
    await this.initiativeService.updateCommitteeMemberSort(this.initiative.id, data.item.data.id, data.currentIndex);
    this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.SORTED');
  }

  private addMember(member: InitiativeCommitteeMember) {
    this.committee.activeCommitteeMembers = [...this.committee.activeCommitteeMembers, member];
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
    return this.confirmDialogService.confirm({
      title: 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REMOVE_CONFIRMATION.TITLE',
      message: 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REMOVE_CONFIRMATION.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
  }

  private updateApprovedMembersCount(committee: InitiativeCommittee, delta: number): void {
    committee.approvedMembersCount = committee.approvedMembersCount + delta;
    committee.approvedMembersCountOk = committee.approvedMembersCount >= committee.requiredApprovedMembersCount;
  }
}
