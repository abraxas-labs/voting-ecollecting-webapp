/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input } from '@angular/core';
import { CardModule, IconModule } from '@abraxas/base-components';
import { Initiative, InitiativeCommittee, InitiativeCommitteeMember } from '../../../../core/models/initiative.model';
import { InitiativeCommitteeMemberApprovalState, InitiativeCommitteeMemberSignatureType } from '@abraxas/voting-ecollecting-proto';
import { InitiativeService } from '../../../../core/services/initiative.service';
import {
  InitiativeDetailCommitteeMembersVerifyDialogComponent,
  InitiativeDetailCommitteeMembersVerifyDialogData,
} from '../initiative-detail-committee-members-verify-dialog/initiative-detail-committee-members-verify-dialog.component';
import {
  InitiativeDetailCommitteeMembersEditDialogComponent,
  InitiativeDetailCommitteeMembersEditDialogData,
} from '../initiative-detail-committee-members-edit-dialog/initiative-detail-committee-members-edit-dialog.component';
import { CustomDialogService, ToastService } from 'ecollecting-lib';
import { firstValueFrom } from 'rxjs';
import { InitiativeDetailCommitteeMembersTableComponent } from '../initiative-detail-committee-members-table/initiative-detail-committee-members-table.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-initiative-detail-committee-members',
  templateUrl: './initiative-detail-committee-members.component.html',
  imports: [InitiativeDetailCommitteeMembersTableComponent, CardModule, TranslatePipe, IconModule, DecimalPipe],
})
export class InitiativeDetailCommitteeMembersComponent {
  private readonly initiativeService = inject(InitiativeService);
  private readonly customDialogService = inject(CustomDialogService);
  private readonly toast = inject(ToastService);

  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;

  public async reset(member: InitiativeCommitteeMember): Promise<void> {
    await this.initiativeService.resetCommitteeMember(this.initiative.id, member.id);
    this.toast.success('INITIATIVE.COMMITTEE.MEMBERS.VERIFY_DIALOG.RESET');
    if (member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED) {
      this.updateApprovedMembersCount(this.committee, -1);
    }

    this.updateMember(
      member,
      member.signatureType === InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UPLOADED_SIGNATURE
        ? InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED
        : InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED,
    );
    this.moveMember(member, true);
  }

  public async verify(member: InitiativeCommitteeMember): Promise<void> {
    const dialogRef = this.customDialogService.openWithoutAutoFocus(InitiativeDetailCommitteeMembersVerifyDialogComponent, {
      initiativeId: this.initiative.id,
      memberId: member.id,
    } satisfies InitiativeDetailCommitteeMembersVerifyDialogData);

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result?.approvalState) {
      return;
    }

    if (result.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED) {
      this.updateApprovedMembersCount(this.committee, 1);
    }

    this.updateMember(member, result.approvalState);
    this.moveMember(
      member,
      result.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED,
    );
  }

  protected async edit(member: InitiativeCommitteeMember) {
    this.customDialogService.openWithoutAutoFocus(InitiativeDetailCommitteeMembersEditDialogComponent, {
      initiativeId: this.initiative.id,
      member,
    } satisfies InitiativeDetailCommitteeMembersEditDialogData);
  }

  private updateMember(member: InitiativeCommitteeMember, approvalState: InitiativeCommitteeMemberApprovalState): void {
    if (!member.userPermissions) {
      return;
    }

    member.approvalState = approvalState;
    member.userPermissions.canVerify =
      member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED ||
      member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED;
    member.userPermissions.canReset =
      member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED ||
      member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REJECTED;
  }

  private updateApprovedMembersCount(committee: InitiativeCommittee, delta: number): void {
    committee.approvedMembersCount = committee.approvedMembersCount + delta;
    committee.approvedMembersCountOk = committee.approvedMembersCount >= committee.requiredApprovedMembersCount;
  }

  private moveMember(member: InitiativeCommitteeMember, toActive: boolean): void {
    const source = toActive ? this.committee.rejectedOrExpiredCommitteeMembers : this.committee.activeCommitteeMembers;
    const target = toActive ? this.committee.activeCommitteeMembers : this.committee.rejectedOrExpiredCommitteeMembers;

    if (target.filter(m => m.id === member.id).length === 1) {
      return;
    }

    const memberToMove = source.find(m => m.id === member.id);
    if (!memberToMove) {
      return;
    }

    const updatedSource = source.filter(m => m.id !== member.id);
    const updatedTarget = [...target, member];

    if (toActive) {
      this.committee.rejectedOrExpiredCommitteeMembers = updatedSource;
      this.committee.activeCommitteeMembers = updatedTarget;
    } else {
      this.committee.activeCommitteeMembers = updatedSource;
      this.committee.rejectedOrExpiredCommitteeMembers = updatedTarget;
    }
  }
}
