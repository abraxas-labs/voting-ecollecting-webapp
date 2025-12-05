/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  BreadcrumbItemModule,
  BreadcrumbsModule,
  ButtonModule,
  DialogService,
  DividerModule,
  SpinnerModule,
  SubNavigationBarModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';
import { firstValueFrom, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Initiative } from '../../core/models/initiative.model';
import { Referendum } from '../../core/models/referendum.model';
import { CheckSamplesHeaderComponent } from '../check-samples-header/check-samples-header.component';
import { CollectionSignatureSheet } from '../../core/models/collection.model';
import { CollectionSignatureSheetState } from '@abraxas/voting-ecollecting-proto/admin';
import { ConfirmDialogComponent, ConfirmDialogData, DomainOfInfluence } from 'ecollecting-lib';
import { CheckSamplesSignatureSheetTableComponent } from '../check-samples-signature-sheet-table/check-samples-signature-sheet-table.component';
import { CollectionMunicipalityService } from '../../core/services/collection-municipality.service';

@Component({
  selector: 'app-check-samples-municipality-overview',
  templateUrl: './check-samples-municipality-overview.component.html',
  styleUrls: ['./check-samples-municipality-overview.component.scss'],
  imports: [
    SubNavigationBarModule,
    BreadcrumbsModule,
    DividerModule,
    CheckSamplesHeaderComponent,
    BreadcrumbItemModule,
    TranslatePipe,
    CheckSamplesSignatureSheetTableComponent,
    SpinnerModule,
    ButtonModule,
  ],
  providers: [DialogService],
})
export class CheckSamplesMunicipalityOverviewComponent implements OnInit, OnDestroy {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly collectionMunicipalityService = inject(CollectionMunicipalityService);

  protected readonly collectionTypes = CollectionType;
  protected collection?: Initiative | Referendum;
  protected loading = false;
  protected domainOfInfluence?: DomainOfInfluence;
  protected signatureSheets?: CollectionSignatureSheet[];

  private routeSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection, domainOfInfluence }) => {
      this.collection = collection;
      this.domainOfInfluence = domainOfInfluence;
    });
  }

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected async back(): Promise<void> {
    await this.router.navigate(['../'], { relativeTo: this.route });
  }

  protected async submitAll(): Promise<void> {
    if (!this.collection || !this.domainOfInfluence || !this.signatureSheets) {
      return;
    }

    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.SUBMIT_ALL.TITLE',
      message: 'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.SUBMIT_ALL.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    const result = await this.collectionMunicipalityService.submitSignatureSheets(this.collection.id, this.domainOfInfluence.bfs);
    this.collection.collection.attestedCollectionCount = result.collectionCount;

    for (const signatureSheet of this.signatureSheets) {
      if (
        signatureSheet.state !== CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_ATTESTED ||
        !signatureSheet.userPermissions
      ) {
        continue;
      }

      // update each affected signature sheet instead loading whole table again
      signatureSheet.state = CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_SUBMITTED;
      signatureSheet.userPermissions.canSubmit = false;
      signatureSheet.userPermissions.canDiscard = false;
      signatureSheet.userPermissions.canUnsubmit = true;
    }
  }

  private async loadData(): Promise<void> {
    if (!this.collection || !this.domainOfInfluence) {
      return;
    }

    try {
      this.loading = true;
      this.signatureSheets = await this.collectionMunicipalityService.listSignatureSheets(this.collection.id, this.domainOfInfluence.bfs);
    } finally {
      this.loading = false;
    }
  }
}
