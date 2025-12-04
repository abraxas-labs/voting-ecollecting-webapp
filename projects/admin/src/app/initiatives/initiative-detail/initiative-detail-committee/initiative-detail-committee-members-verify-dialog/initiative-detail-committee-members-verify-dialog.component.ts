/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { DialogComponent, isGrpcError, ToastService } from 'ecollecting-lib';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VotingLibModule } from '@abraxas/voting-lib';
import { ButtonModule, LabelModule, ReadonlyModule, SpinnerModule, StatusLabelModule } from '@abraxas/base-components';
import { InitiativeService } from '../../../../core/services/initiative.service';
import { VerifyInitiativeCommitteeMemberResponse } from '../../../../core/models/initiative.model';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { InitiativeCommitteeMemberApprovalState } from '@abraxas/voting-ecollecting-proto';

const personNotFoundException = 'PersonNotFoundException';
const noPermissionStimmregisterException = 'NoPermissionStimmregisterException';

@Component({
  selector: 'app-initiative-detail-committee-members-verify-dialog',
  imports: [
    ReadonlyModule,
    DialogComponent,
    VotingLibModule,
    ButtonModule,
    TranslatePipe,
    LabelModule,
    StatusLabelModule,
    DatePipe,
    SpinnerModule,
  ],
  templateUrl: './initiative-detail-committee-members-verify-dialog.component.html',
  styleUrls: ['./initiative-detail-committee-members-verify-dialog.component.scss'],
})
export class InitiativeDetailCommitteeMembersVerifyDialogComponent implements OnInit {
  protected readonly dialogData = inject<InitiativeDetailCommitteeMembersVerifyDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef =
    inject<MatDialogRef<InitiativeDetailCommitteeMembersVerifyDialogComponent, InitiativeDetailCommitteeMembersVerifyDialogResult>>(
      MatDialogRef,
    );
  private readonly initiativeService = inject(InitiativeService);
  private readonly toast = inject(ToastService);

  protected approving = false;
  protected rejecting = false;
  protected loading = false;
  protected personNotFound = false;
  protected noPermission = false;
  protected verifyResponse?: VerifyInitiativeCommitteeMemberResponse;

  public async ngOnInit() {
    try {
      this.loading = true;
      this.verifyResponse = await this.initiativeService.verifyCommitteeMember(this.dialogData.initiativeId, this.dialogData.memberId);
    } catch (e) {
      if (isGrpcError(e, personNotFoundException)) {
        this.personNotFound = true;
      } else if (isGrpcError(e, noPermissionStimmregisterException)) {
        this.noPermission = true;
      } else {
        throw e;
      }
    } finally {
      this.loading = false;
    }
  }

  public async approve(): Promise<void> {
    try {
      this.approving = true;
      await this.initiativeService.approveCommitteeMember(this.dialogData.initiativeId, this.dialogData.memberId);
      this.toast.success('INITIATIVE.COMMITTEE.MEMBERS.VERIFY_DIALOG.APPROVED');
      this.dialogRef.close({
        approvalState: InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED,
      } satisfies InitiativeDetailCommitteeMembersVerifyDialogResult);
    } finally {
      this.approving = false;
    }
  }

  public async reject(): Promise<void> {
    try {
      this.rejecting = true;
      await this.initiativeService.rejectCommitteeMember(this.dialogData.initiativeId, this.dialogData.memberId);
      this.toast.success('INITIATIVE.COMMITTEE.MEMBERS.VERIFY_DIALOG.REJECTED');
      this.dialogRef.close({
        approvalState: InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REJECTED,
      } satisfies InitiativeDetailCommitteeMembersVerifyDialogResult);
    } finally {
      this.rejecting = false;
    }
  }
}

export interface InitiativeDetailCommitteeMembersVerifyDialogData {
  initiativeId: string;
  memberId: string;
}

export interface InitiativeDetailCommitteeMembersVerifyDialogResult {
  approvalState?: InitiativeCommitteeMemberApprovalState;
}
