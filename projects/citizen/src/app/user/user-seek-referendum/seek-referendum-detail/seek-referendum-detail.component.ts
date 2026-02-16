/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import { filter, firstValueFrom, startWith, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  ButtonModule,
  CardModule,
  DialogService,
  IconButtonModule,
  NavigationModule,
  NavLayoutModule,
  SubNavigationBarModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { UserHelpMenuDialogComponent } from '../../user-help-menu-dialog/user-help-menu-dialog.component';
import { TranslatePipe } from '@ngx-translate/core';
import { detailGeneralInformationUrl, detailOverviewUrl, detailPermissionsUrl, detailSignatureSheetUrl } from '../../user.routes';
import {
  CollectionMessagesComponent,
  CollectionMessagesComponentData,
  CollectionMessagesComponentResult,
  ConfirmDialogService,
  newSimpleDecree,
  SHOW_CHAT_QUERY_PARAM,
} from 'ecollecting-lib';
import { CollectionState, CollectionType } from '@abraxas/voting-ecollecting-proto';
import { Referendum } from '../../../core/models/referendum.model';
import { ReferendumService } from '../../../core/services/referendum.service';
import { CollectionService } from '../../../core/services/collection.service';
import {
  SeekReferendumDetailSelectDecreeDialogComponent,
  SeekReferendumDetailSelectDecreeDialogData,
} from './seek-referendum-detail-select-decree-dialog/seek-referendum-detail-select-decree-dialog.component';
import {
  CollectionValidationDialogComponent,
  CollectionValidationDialogData,
} from '../../../core/components/collection-validation-dialog/collection-validation-dialog.component';

@Component({
  selector: 'app-seek-referendum-detail',
  imports: [
    SubNavigationBarModule,
    IconButtonModule,
    TranslatePipe,
    NavLayoutModule,
    NavigationModule,
    ButtonModule,
    RouterOutlet,
    CardModule,
    TooltipModule,
    TruncateWithTooltipModule,
  ],
  templateUrl: './seek-referendum-detail.component.html',
  styleUrls: ['./seek-referendum-detail.component.scss'],
  providers: [DialogService],
})
export class SeekReferendumDetailComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly referendumService = inject(ReferendumService);
  private readonly collectionService = inject(CollectionService);

  public readonly detailOverviewUrl = detailOverviewUrl;
  public readonly detailGeneralInformationUrl = detailGeneralInformationUrl;
  public readonly detailSignatureSheetUrl = detailSignatureSheetUrl;
  public readonly detailPermissionsUrl = detailPermissionsUrl;

  public referendum?: Referendum;
  public active = detailOverviewUrl;
  public submitting = false;

  private routeSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private routerEventsSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(async ({ referendum }) => {
      this.referendum = referendum;
    });
    this.queryParamsSubscription = this.route.queryParamMap.subscribe(params => {
      if (params.has(SHOW_CHAT_QUERY_PARAM)) {
        void this.openChat();
      }
    });
    this.routerEventsSubscription = this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd),
        startWith(this.router),
      )
      .subscribe(event => {
        // get sixth url param, as the type of route is stored there
        const pathParts = (event as NavigationEnd).url.split('/');
        if (pathParts.length < 6) {
          return;
        }

        this.active = pathParts[5];
      });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.queryParamsSubscription.unsubscribe();
    this.routerEventsSubscription.unsubscribe();
  }

  public async back(): Promise<void> {
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public openHelpMenu(): void {
    this.dialogService.openRight(UserHelpMenuDialogComponent, {});
  }

  public async openChat(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    const dialogRef = this.dialogService.openRight(CollectionMessagesComponent, {
      collectionId: this.referendum.id,
      collectionType: CollectionType.COLLECTION_TYPE_REFERENDUM,
      isEditable: this.referendum.collection.userPermissions?.canCreateMessages ?? false,
      isRequestInformalReviewVisible: this.referendum.collection.userPermissions?.isRequestInformalReviewVisible ?? false,
      canRequestInformalReview: this.referendum.collection.userPermissions?.canRequestInformalReview ?? false,
    } satisfies CollectionMessagesComponentData);

    const result = (await firstValueFrom(dialogRef.afterClosed())) as CollectionMessagesComponentResult;
    if (!result || !this.referendum.collection.userPermissions) {
      return;
    }

    this.referendum.collection.informalReviewRequested = result.informalReviewRequested;
    this.referendum.collection.userPermissions.canRequestInformalReview = !result.informalReviewRequested && !!this.referendum.decree;
  }

  public async requestInformalReview(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'COLLECTION_MESSAGES.REQUEST_INFORMAL_REVIEW_CONFIRM.TITLE',
      message: 'COLLECTION_MESSAGES.REQUEST_INFORMAL_REVIEW_CONFIRM.MESSAGE',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    await this.collectionService.updateRequestInformalReview(this.referendum.id, true);
    await this.openChat();
  }

  public async withdraw(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'SEEK_REFERENDUM.DETAIL.WITHDRAW.TITLE',
      message: 'SEEK_REFERENDUM.DETAIL.WITHDRAW.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    await this.collectionService.withdraw(this.referendum.id);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public async submit(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    const validationSummary = await this.collectionService.validate(this.referendum.id);
    const dialogRef = this.dialogService.open(CollectionValidationDialogComponent, {
      title: 'SEEK_REFERENDUM.DETAIL.VALIDATION.TITLE',
      info: 'SEEK_REFERENDUM.DETAIL.VALIDATION.INFO',
      validationSummary,
    } satisfies CollectionValidationDialogData);

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) {
      return;
    }

    try {
      this.submitting = true;
      await this.referendumService.submit(this.referendum.id);
    } finally {
      this.submitting = false;
    }

    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public async selectDecree(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    const dialogRef = this.dialogService.open(SeekReferendumDetailSelectDecreeDialogComponent, {
      referendumId: this.referendum.id,
      decreeId: this.referendum.decree?.id,
    } satisfies SeekReferendumDetailSelectDecreeDialogData);
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    this.referendum.decree ??= newSimpleDecree();
    this.referendum.decree.id = result.decreeId;
    if (result.decreeDescription) {
      this.referendum.decree.description = result.decreeDescription;
    }

    if (!this.referendum.collection.userPermissions) {
      return;
    }

    this.referendum.collection.userPermissions.canRequestInformalReview =
      this.referendum.collection.state === CollectionState.COLLECTION_STATE_IN_PREPARATION &&
      !!result.decreeId &&
      !this.referendum.collection.informalReviewRequested;
  }
}
