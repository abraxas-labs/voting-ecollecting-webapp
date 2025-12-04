/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnChanges, inject } from '@angular/core';
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
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { Initiative, InitiativeCommittee, InitiativeCommitteeMember } from '../../../../core/models/initiative.model';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { InitiativeCommitteeMemberApprovalState, InitiativeCommitteeMemberSignatureType } from '@abraxas/voting-ecollecting-proto';
import { InitiativeService } from '../../../../core/services/initiative.service';
import {
  InitiativeDetailCommitteeMembersVerifyDialogComponent,
  InitiativeDetailCommitteeMembersVerifyDialogData,
} from '../initiative-detail-committee-members-verify-dialog/initiative-detail-committee-members-verify-dialog.component';
import { ToastService } from 'ecollecting-lib';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-initiative-detail-committee-members',
  templateUrl: './initiative-detail-committee-members.component.html',
  styleUrls: ['./initiative-detail-committee-members.component.scss'],
  imports: [
    CardModule,
    TranslatePipe,
    ButtonModule,
    DecimalPipe,
    IconModule,
    DatePipe,
    IconButtonModule,
    StatusLabelModule,
    TableModule,
    TooltipModule,
    TranslateDirective,
    TruncateWithTooltipModule,
    SpinnerModule,
  ],
})
export class InitiativeDetailCommitteeMembersComponent implements OnChanges {
  private readonly initiativeService = inject(InitiativeService);
  private readonly dialogService = inject(DialogService);
  private readonly toast = inject(ToastService);

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

  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;

  protected dataSource = new TableDataSource<InitiativeCommitteeMember>();

  public ngOnChanges(): void {
    this.dataSource.data = this.committee.committeeMembers;
  }

  public async reset(member: InitiativeCommitteeMember): Promise<void> {
    await this.initiativeService.resetCommitteeMember(this.initiative.id, member.id);
    this.toast.success('INITIATIVE.COMMITTEE.MEMBERS.VERIFY_DIALOG.RESET');
    if (member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED) {
      this.updateApprovedMembersCount(this.committee, -1);
    }

    this.updateMember(member, InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED);
  }

  public async verify(member: InitiativeCommitteeMember): Promise<void> {
    const dialogRef = this.dialogService.open(InitiativeDetailCommitteeMembersVerifyDialogComponent, {
      initiativeId: this.initiative.id,
      memberId: member.id,
    } satisfies InitiativeDetailCommitteeMembersVerifyDialogData);

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result || !result.approvalState) {
      return;
    }

    if (result.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED) {
      this.updateApprovedMembersCount(this.committee, 1);
    }

    this.updateMember(member, result.approvalState);
  }

  private updateMember(member: InitiativeCommitteeMember, approvalState: InitiativeCommitteeMemberApprovalState): void {
    member.approvalState = approvalState;
    member.canVerify = member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED;
    member.canReset =
      member.signatureType === InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UPLOADED_SIGNATURE &&
      (member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED ||
        member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REJECTED);
  }

  private updateApprovedMembersCount(committee: InitiativeCommittee, delta: number): void {
    committee.approvedMembersCount = committee.approvedMembersCount + delta;
    committee.approvedMembersCountOk = committee.approvedMembersCount >= committee.requiredApprovedMembersCount;
  }
}
