/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionService } from '../core/services/collection.service';
import { PendingCollectionPermission } from '../core/models/collection.model';
import { ButtonModule, CardModule, DialogService, SpinnerModule } from '@abraxas/base-components';
import { VotingLibModule } from '@abraxas/voting-lib';
import { ToastService } from 'ecollecting-lib';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';
import { ApprovalPageComponent } from '../core/components/approval-page/approval-page.component';
import { ApprovalPageCardComponent } from '../core/components/approval-page/approval-page-card/approval-page-card.component';
import { ApprovalPageBaseComponent } from '../core/components/approval-page/approval-page-base.component';

@Component({
  selector: 'app-permission-approval',
  imports: [TranslatePipe, SpinnerModule, VotingLibModule, CardModule, ButtonModule, ApprovalPageComponent, ApprovalPageCardComponent],
  templateUrl: './permission-approval.component.html',
  providers: [DialogService],
})
export class PermissionApprovalComponent extends ApprovalPageBaseComponent<PendingCollectionPermission> {
  private readonly collectionService = inject(CollectionService);
  private readonly toast = inject(ToastService);

  constructor() {
    super('permission-approval.', 'COLLECTION.DETAIL.PERMISSIONS.APPROVAL');
  }

  protected override get acceptAcceptedAcrs(): string[] {
    return this.data?.acceptAcceptedAcrs ?? [];
  }

  protected override rejectByToken(token: string): Promise<void> {
    return this.collectionService.rejectPermissionByToken(token);
  }

  protected override async acceptByToken(token: string): Promise<void> {
    await this.collectionService.acceptPermissionByToken(token);
    this.toast.success('COLLECTION.DETAIL.PERMISSIONS.APPROVAL.IAM.DONE');
    await this.router.navigate([
      '/',
      '-',
      this.data!.collectionType === CollectionType.COLLECTION_TYPE_REFERENDUM ? 'referendums' : 'initiatives',
      this.data!.collectionId,
    ]);
  }

  protected override loadDataByToken(token: string): Promise<PendingCollectionPermission> {
    return this.collectionService.getPendingPermissionByToken(token);
  }
}
