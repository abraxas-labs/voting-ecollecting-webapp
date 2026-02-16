/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionService } from '../core/services/collection.service';
import { PendingCollectionPermission } from '../core/models/collection.model';
import { ButtonModule, CardModule, DialogService, LinkModule, SpinnerModule } from '@abraxas/base-components';
import { VotingLibModule } from '@abraxas/voting-lib';
import { ApprovalPageComponent } from '../core/components/approval-page/approval-page.component';
import { ApprovalPageCardComponent } from '../core/components/approval-page/approval-page-card/approval-page-card.component';
import { ApprovalPageBaseComponent } from '../core/components/approval-page/approval-page-base.component';
import { launchInitiativeUrl, seekReferendumUrl } from '../user/user.routes';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-permission-approval',
  imports: [
    TranslatePipe,
    SpinnerModule,
    VotingLibModule,
    CardModule,
    ButtonModule,
    ApprovalPageComponent,
    ApprovalPageCardComponent,
    LinkModule,
  ],
  templateUrl: './permission-approval.component.html',
  providers: [DialogService],
})
export class PermissionApprovalComponent extends ApprovalPageBaseComponent<PendingCollectionPermission> {
  private readonly collectionService = inject(CollectionService);
  protected accepted = false;

  constructor() {
    super('permission-approval.', 'COLLECTION.DETAIL.PERMISSIONS.APPROVAL');
  }

  protected get collectionLink(): any[] {
    return [
      '..',
      'user',
      this.data?.collectionType === CollectionType.COLLECTION_TYPE_INITIATIVE ? launchInitiativeUrl : seekReferendumUrl,
      this.data?.collectionId,
    ];
  }

  protected override get acceptAcceptedAcrs(): string[] {
    return this.data?.acceptAcceptedAcrs ?? [];
  }

  protected override rejectByToken(token: string): Promise<void> {
    return this.collectionService.rejectPermissionByToken(token);
  }

  protected override async acceptByToken(token: string): Promise<void> {
    await this.collectionService.acceptPermissionByToken(token);
    this.accepted = true;
  }

  protected override loadDataByToken(token: string): Promise<PendingCollectionPermission> {
    return this.collectionService.getPendingPermissionByToken(token);
  }
}
