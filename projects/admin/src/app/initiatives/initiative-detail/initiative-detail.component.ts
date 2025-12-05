/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  AlertBarModule,
  ButtonModule,
  CardModule,
  DialogService,
  DividerModule,
  IconButtonModule,
  LabelModule,
  LinkModule,
  ReadonlyModule,
  SpinnerModule,
  StatusLabelModule,
  SubNavigationBarModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmDialogComponent, ConfirmDialogData, FileChipComponent, ImageUploadComponent } from 'ecollecting-lib';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Collection } from '../../core/models/collection.model';
import { CollectionDetailPermissionsComponent } from '../../core/components/collection-permissions/collection-permissions.component';
import { Initiative } from '../../core/models/initiative.model';
import { AbstractCollectionDetailBase } from '../../core/components/collection-detail-base/collection-detail-base.component';
import { InitiativeService } from '../../core/services/initiative.service';
import { CollectionState } from '@abraxas/voting-ecollecting-proto';
import { VotingLibModule } from '@abraxas/voting-lib';
import {
  InitiativeCollectionPeriodDialogComponent,
  InitiativeCollectionPeriodDialogData,
  InitiativeCollectionPeriodDialogResult,
} from '../initiative-collection-period-dialog/initiative-collection-period-dialog.component';
import { InitiativeDetailCommitteeComponent } from './initiative-detail-committee/initiative-detail-committee.component';
import {
  InitiativeReturnForCorrectionDialogComponent,
  InitiativeReturnForCorrectionDialogData,
} from '../initiative-return-for-correction-dialog/initiative-return-for-correction-dialog.component';

@Component({
  selector: 'app-initiative-detail',
  templateUrl: './initiative-detail.component.html',
  styleUrls: ['./initiative-detail.component.scss'],
  imports: [
    SubNavigationBarModule,
    TranslatePipe,
    CardModule,
    IconButtonModule,
    ButtonModule,
    AlertBarModule,
    StatusLabelModule,
    FileChipComponent,
    DividerModule,
    ReadonlyModule,
    LinkModule,
    AsyncPipe,
    ImageUploadComponent,
    LabelModule,
    CollectionDetailPermissionsComponent,
    DecimalPipe,
    VotingLibModule,
    SpinnerModule,
    TooltipModule,
    TruncateWithTooltipModule,
    InitiativeDetailCommitteeComponent,
  ],
  providers: [DialogService],
})
export class InitiativeDetailComponent extends AbstractCollectionDetailBase implements OnDestroy {
  private readonly initiativeService = inject(InitiativeService);

  protected readonly collectionStates: typeof CollectionState = CollectionState;
  protected initiative?: Initiative;

  protected updating = false;

  private routeSubscription: Subscription;

  constructor() {
    super();
    this.routeSubscription = this.route.data.subscribe(({ initiative }) => (this.initiative = initiative));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected override get collection(): Collection | undefined {
    return this.initiative?.collection;
  }

  public async finishCorrection(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'INITIATIVE.FINISH_CORRECTION.TITLE',
      message: 'INITIATIVE.FINISH_CORRECTION.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    try {
      this.updating = true;
      await this.initiativeService.finishCorrection(this.initiative.id);
      this.initiative.collection.state = CollectionState.COLLECTION_STATE_READY_FOR_REGISTRATION;

      if (this.initiative.collection.userPermissions) {
        this.initiative.collection.userPermissions.canFinishCorrection = false;
      }
    } finally {
      this.updating = false;
    }
  }

  public async setCollectionPeriod(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const dialogRef = this.dialogService.open(InitiativeCollectionPeriodDialogComponent, {
      collectionId: this.initiative.id,
      collectionStartDate: this.initiative.collection.collectionStartDate,
      collectionEndDate: this.initiative.collection.collectionEndDate,
      title: 'INITIATIVE.SET_COLLECTION_PERIOD.TITLE',
      message: 'INITIATIVE.SET_COLLECTION_PERIOD.MSG',
    } satisfies InitiativeCollectionPeriodDialogData);
    const result = (await firstValueFrom(dialogRef.afterClosed())) as InitiativeCollectionPeriodDialogResult;

    if (!result?.collectionStartDate || !result?.collectionEndDate) {
      return;
    }

    await this.initiativeService.setCollectionPeriod(this.initiative.id, result.collectionStartDate, result.collectionEndDate);

    if (this.initiative.collection.userPermissions) {
      this.initiative.collection.userPermissions.canSetCollectionPeriod = false;
    }
  }

  public async enable(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const dialogRef = this.dialogService.open(InitiativeCollectionPeriodDialogComponent, {
      collectionId: this.initiative.id,
      collectionStartDate: this.initiative.collection.collectionStartDate,
      collectionEndDate: this.initiative.collection.collectionEndDate,
      title: 'INITIATIVE.ENABLE.TITLE',
      message: 'INITIATIVE.ENABLE.MSG',
    } satisfies InitiativeCollectionPeriodDialogData);
    const result = (await firstValueFrom(dialogRef.afterClosed())) as InitiativeCollectionPeriodDialogResult;

    if (!result) {
      return;
    }

    await this.initiativeService.enable(this.initiative.id, result.collectionStartDate, result.collectionEndDate);
    this.initiative.collection.state = CollectionState.COLLECTION_STATE_PREPARING_FOR_COLLECTION;

    if (this.initiative.collection.userPermissions) {
      this.initiative.collection.userPermissions.canEnable = false;
    }
  }

  public async returnForCorrection(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const dialogRef = this.dialogService.open(InitiativeReturnForCorrectionDialogComponent, {
      collectionId: this.initiative.id,
    } satisfies InitiativeReturnForCorrectionDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    this.initiative.collection.state = CollectionState.COLLECTION_STATE_RETURNED_FOR_CORRECTION;
    if (this.initiative.collection.userPermissions) {
      this.initiative.collection.userPermissions.canReturnForCorrection = false;
    }
  }
}
