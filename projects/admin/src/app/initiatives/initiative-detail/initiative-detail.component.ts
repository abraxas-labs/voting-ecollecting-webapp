/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  AlertBarModule,
  ButtonModule,
  CardModule,
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
import { collectionStateColorMap, FileChipComponent, ImagePreviewComponent, ToastService } from 'ecollecting-lib';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Collection } from '../../core/models/collection.model';
import { CollectionDetailPermissionsComponent } from '../../core/components/collection-permissions/collection-permissions.component';
import { Initiative, InitiativeCommittee } from '../../core/models/initiative.model';
import { AbstractCollectionDetailBase } from '../../core/components/collection-detail-base/collection-detail-base.component';
import { InitiativeService } from '../../core/services/initiative.service';
import { CollectionState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { AdmissibilityDecisionState } from '@abraxas/voting-ecollecting-proto/admin';
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
import { FormsModule } from '@angular/forms';
import { InitiativeDetailInfoComponent } from './initiative-detail-info/initiative-detail-info.component';
import { InitiativeDetailEditComponent } from './initiative-detail-edit/initiative-detail-edit.component';
import { HasAnyRoleDirective } from '../../core/directives/has-any-role.directive';

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
    LabelModule,
    CollectionDetailPermissionsComponent,
    DecimalPipe,
    VotingLibModule,
    SpinnerModule,
    TooltipModule,
    TruncateWithTooltipModule,
    InitiativeDetailCommitteeComponent,
    FormsModule,
    InitiativeDetailInfoComponent,
    InitiativeDetailEditComponent,
    ImagePreviewComponent,
    HasAnyRoleDirective,
  ],
})
export class InitiativeDetailComponent extends AbstractCollectionDetailBase implements OnDestroy {
  private readonly initiativeService = inject(InitiativeService);
  protected readonly collectionStates: typeof CollectionState = CollectionState;
  protected readonly collectionStateColorMap = collectionStateColorMap;
  protected readonly ctDoiType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT;
  protected readonly admissibilityDecisionStateOpen = AdmissibilityDecisionState.ADMISSIBILITY_DECISION_STATE_OPEN;
  protected initiative?: Initiative;
  protected committee?: InitiativeCommittee;
  protected generatingAdmissibilityDecisionInformation = false;

  @ViewChild(InitiativeDetailEditComponent)
  private editComponent?: InitiativeDetailEditComponent;

  private readonly toast = inject(ToastService);
  protected updating = false;

  private routeSubscription: Subscription;

  constructor() {
    super();
    this.routeSubscription = this.route.data.subscribe(async ({ initiative }) => {
      this.initiative = initiative;
      this.committee = await this.initiativeService.getCommittee(initiative.id);
    });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected override get collection(): Collection | undefined {
    return this.initiative?.collection;
  }

  protected override async saveEdits(): Promise<boolean> {
    if (!this.initiative || !this.editComponent) {
      return false;
    }

    const values = this.editComponent.getFormValues();
    if (!values) {
      this.toast.error('APP.FORM_INVALID_TITLE', 'APP.FORM_INVALID_MESSAGE');
      return false;
    }

    await this.initiativeService.update({
      id: this.initiative.id,
      subTypeId: this.initiative.subType?.id ?? '',
      description: values.description,
      wording: values.wording,
      address: values.address,
      reason: values.reason,
    });

    // refetch to update rendered markdown
    Object.assign(this.initiative, await this.initiativeService.get(this.initiative.id));
    this.toast.saved();
    return true;
  }

  public async finishCorrection(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'INITIATIVE.FINISH_CORRECTION_DIALOG.TITLE',
      message: 'INITIATIVE.FINISH_CORRECTION_DIALOG.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    try {
      this.updating = true;
      await this.initiativeService.finishCorrection(this.initiative.id);
      this.initiative.collection.state = CollectionState.COLLECTION_STATE_READY_FOR_REGISTRATION;

      if (this.initiative.collection.userPermissions) {
        this.initiative.collection.userPermissions.canFinishCorrection = false;
        this.initiative.collection.userPermissions.canReturnForCorrection = false;
      }
    } finally {
      this.updating = false;
    }
  }

  public async setCollectionPeriod(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const dialogRef = this.customDialogService.openWithoutAutoFocus(InitiativeCollectionPeriodDialogComponent, {
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

    const dialogRef = this.customDialogService.openWithoutAutoFocus(InitiativeCollectionPeriodDialogComponent, {
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

    const dialogRef = this.customDialogService.openWithoutAutoFocus(InitiativeReturnForCorrectionDialogComponent, {
      collectionId: this.initiative.id,
    } satisfies InitiativeReturnForCorrectionDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    this.initiative.collection.state = CollectionState.COLLECTION_STATE_RETURNED_FOR_CORRECTION;
    if (this.initiative.collection.userPermissions) {
      this.initiative.collection.userPermissions.canReturnForCorrection = false;
      this.initiative.collection.userPermissions.canFinishCorrection = false;
    }
  }

  public async downloadAdmissibilityDecisionInformation(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    try {
      this.generatingAdmissibilityDecisionInformation = true;
      await this.initiativeService.downloadAdmissibilityDecisionInformation(this.initiative.id);
    } finally {
      this.generatingAdmissibilityDecisionInformation = false;
    }
  }
}
