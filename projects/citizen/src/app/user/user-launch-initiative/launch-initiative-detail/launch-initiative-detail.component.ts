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
  DialogService,
  IconButtonModule,
  NavigationModule,
  NavLayoutModule,
  SubNavigationBarModule,
} from '@abraxas/base-components';
import { Initiative } from '../../../core/models/initiative.model';
import { UserHelpMenuDialogComponent } from '../../user-help-menu-dialog/user-help-menu-dialog.component';
import { TranslatePipe } from '@ngx-translate/core';
import {
  detailCommitteeUrl,
  detailGeneralInformationUrl,
  detailOverviewUrl,
  detailPermissionsUrl,
  detailSignatureSheetUrl,
} from '../../user.routes';
import {
  CollectionMessagesComponent,
  CollectionMessagesComponentData,
  CollectionMessagesComponentResult,
  ConfirmDialogService,
  SHOW_CHAT_QUERY_PARAM,
} from 'ecollecting-lib';
import { CollectionService } from '../../../core/services/collection.service';
import { CollectionState, CollectionType } from '@abraxas/voting-ecollecting-proto';
import { InitiativeService } from '../../../core/services/initiative.service';
import {
  CollectionValidationDialogComponent,
  CollectionValidationDialogData,
} from '../../../core/components/collection-validation-dialog/collection-validation-dialog.component';

@Component({
  selector: 'app-launch-initiative-detail',
  imports: [SubNavigationBarModule, IconButtonModule, TranslatePipe, NavLayoutModule, NavigationModule, ButtonModule, RouterOutlet],
  templateUrl: './launch-initiative-detail.component.html',
  styleUrls: ['./launch-initiative-detail.component.scss'],
  providers: [DialogService],
})
export class LaunchInitiativeDetailComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly collectionService = inject(CollectionService);
  private readonly initiativeService = inject(InitiativeService);

  public readonly initiativeDetailOverviewUrl = detailOverviewUrl;
  public readonly initiativeDetailGeneralInformationUrl = detailGeneralInformationUrl;
  public readonly initiativeDetailPermissionsUrl = detailPermissionsUrl;
  public readonly initiativeDetailSignatureSheetUrl = detailSignatureSheetUrl;
  public readonly initiativeDetailCommitteeUrl = detailCommitteeUrl;

  public readonly collectionStates: typeof CollectionState = CollectionState;

  public initiative?: Initiative;
  public active = detailOverviewUrl;

  private routeSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private routerEventsSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(async ({ initiative }) => {
      this.initiative = initiative;
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
    if (!this.initiative) {
      return;
    }

    const dialogRef = this.dialogService.openRight(CollectionMessagesComponent, {
      collectionId: this.initiative.id,
      collectionType: CollectionType.COLLECTION_TYPE_INITIATIVE,
      isEditable: this.initiative.collection.userPermissions?.canCreateMessages ?? false,
      isRequestInformalReviewVisible: this.initiative.collection.userPermissions?.isRequestInformalReviewVisible ?? false,
      canRequestInformalReview: this.initiative.collection.userPermissions?.canRequestInformalReview ?? false,
    } satisfies CollectionMessagesComponentData);

    const result = (await firstValueFrom(dialogRef.afterClosed())) as CollectionMessagesComponentResult;
    if (!result || !this.initiative.collection.userPermissions) {
      return;
    }

    this.initiative.collection.informalReviewRequested = result.informalReviewRequested;
    this.initiative.collection.userPermissions.canRequestInformalReview = !result.informalReviewRequested;
  }

  public async requestInformalReview(): Promise<void> {
    if (!this.initiative) {
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

    await this.collectionService.updateRequestInformalReview(this.initiative.id, true);
    await this.openChat();
  }

  public async withdraw(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'LAUNCH_INITIATIVE.DETAIL.WITHDRAW.TITLE',
      message: 'LAUNCH_INITIATIVE.DETAIL.WITHDRAW.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    await this.collectionService.withdraw(this.initiative.id);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public async submit(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const result = await this.validate(this.initiative.id);
    if (!result) {
      return;
    }

    await this.initiativeService.submit(this.initiative.id);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public async flagForReview(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    const result = await this.validate(this.initiative.id);
    if (!result) {
      return;
    }

    await this.initiativeService.flagForReview(this.initiative.id);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public async register(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    await this.initiativeService.register(this.initiative.id);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  private async validate(id: string): Promise<boolean> {
    const validationSummary = await this.collectionService.validate(id);
    const dialogRef = this.dialogService.open(CollectionValidationDialogComponent, {
      title: 'LAUNCH_INITIATIVE.DETAIL.VALIDATION.TITLE',
      info: 'LAUNCH_INITIATIVE.DETAIL.VALIDATION.INFO',
      validationSummary,
    } satisfies CollectionValidationDialogData);

    return firstValueFrom(dialogRef.afterClosed());
  }
}
