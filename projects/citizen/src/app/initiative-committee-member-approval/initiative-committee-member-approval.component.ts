/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { ButtonModule, DialogService, ExpansionPanelModule, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { PendingInitiativeCommitteeMembership } from '../core/models/initiative.model';
import { ApprovalPageCardComponent } from '../core/components/approval-page/approval-page-card/approval-page-card.component';
import { ApprovalPageComponent } from '../core/components/approval-page/approval-page.component';
import { TranslatePipe } from '@ngx-translate/core';
import { InitiativeService } from '../core/services/initiative.service';
import { ApprovalPageBaseComponent } from '../core/components/approval-page/approval-page-base.component';
import { FileUploadComponent } from 'ecollecting-lib';
import { MarkdownPreviewComponent } from '@abraxas/voting-lib';

@Component({
  selector: 'app-initiative-committee-member-approval',
  imports: [
    ApprovalPageCardComponent,
    ApprovalPageComponent,
    ButtonModule,
    TranslatePipe,
    SpinnerModule,
    FileUploadComponent,
    ExpansionPanelModule,
    ReadonlyModule,
    MarkdownPreviewComponent,
  ],
  templateUrl: './initiative-committee-member-approval.component.html',
  styleUrl: './initiative-committee-member-approval.component.scss',
  providers: [DialogService],
})
export class InitiativeCommitteeMemberApprovalComponent extends ApprovalPageBaseComponent<PendingInitiativeCommitteeMembership> {
  private readonly initiativeService = inject(InitiativeService);

  protected generating = false;
  protected uploading = false;
  protected acceptedIAM = false;
  protected acceptedUpload = false;
  protected readonly maxFileSize = 5 * 1024 * 1024; // 5 MB

  constructor() {
    super('initiative-committee-member-approval.', 'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.APPROVAL');
  }

  protected override get acceptAcceptedAcrs(): string[] {
    return this.data?.acceptAcceptedAcrs ?? [];
  }

  protected async downloadTemplate(): Promise<void> {
    if (!this.data) {
      return;
    }

    this.generating = true;
    try {
      this.toast.info('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.APPROVAL.UPLOAD.GENERATING');
      await this.initiativeService.downloadCommitteeListTemplateByToken(this.data.initiativeId, this.token);
      this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.APPROVAL.UPLOAD.GENERATED');
    } finally {
      this.generating = false;
    }
  }

  protected async uploadFile(file: File): Promise<void> {
    if (!this.data) {
      return;
    }

    this.uploading = true;
    try {
      await this.initiativeService.acceptCommitteeMembershipWithCommitteeList(this.data.initiativeId, this.token, file);
      this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.APPROVAL.UPLOAD.ACCEPTED');
      this.acceptedUpload = true;
    } finally {
      this.uploading = false;
    }
  }

  protected override async rejectByToken(token: string): Promise<void> {
    await this.initiativeService.rejectCommitteeMembershipByToken(token);
    this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.APPROVAL.REJECT.DONE');
  }

  protected override async acceptByToken(token: string): Promise<void> {
    const accepted = await this.initiativeService.acceptCommitteeMembershipByToken(token);

    if (!accepted) {
      this.error = 'InitiativeCommitteeMemberApprovalNoVotingRightException';
      this.toast.error('ERROR_MESSAGES.TITLE', 'ERROR_MESSAGES.' + this.error);
    } else {
      this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.APPROVAL.IAM.ACCEPTED');
    }

    this.acceptedIAM = true;
  }

  protected override loadDataByToken(token: string): Promise<PendingInitiativeCommitteeMembership> {
    return this.initiativeService.getPendingCommitteeMembershipByToken(token);
  }
}
