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
      await this.initiativeService.downloadCommitteeListTemplateByToken(this.data.initiativeId, this.token);
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
      this.acceptedUpload = true;
    } finally {
      this.uploading = false;
    }
  }

  protected override rejectByToken(token: string): Promise<void> {
    return this.initiativeService.rejectCommitteeMembershipByToken(token);
  }

  protected override async acceptByToken(token: string): Promise<void> {
    const accepted = await this.initiativeService.acceptCommitteeMembershipByToken(token);

    if (!accepted) {
      this.error = 'InitiativeCommitteeMemberApprovalNoVotingRightException';
    }

    this.acceptedIAM = true;
  }

  protected override loadDataByToken(token: string): Promise<PendingInitiativeCommitteeMembership> {
    return this.initiativeService.getPendingCommitteeMembershipByToken(token);
  }

  protected override async confirm(action: 'IAM' | 'REJECT'): Promise<boolean> {
    // auto-confirm IAM
    return action === 'IAM' || super.confirm(action);
  }
}
