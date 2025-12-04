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
import { CheckSamplesHeaderComponent } from '../check-samples-header/check-samples-header.component';
import { CheckSamplesSignatureSheetTableComponent } from '../check-samples-signature-sheet-table/check-samples-signature-sheet-table.component';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Initiative } from '../../core/models/initiative.model';
import { Referendum } from '../../core/models/referendum.model';
import { firstValueFrom, Subscription } from 'rxjs';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';
import { CollectionSignatureSheet } from '../../core/models/collection.model';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';
import {
  CheckSamplesAddSamplesDialogComponent,
  CheckSamplesAddSamplesDialogData,
  CheckSamplesAddSamplesDialogResult,
} from '../check-samples-add-samples-dialog/check-samples-add-samples-dialog.component';

@Component({
  selector: 'app-check-samples-samples',
  templateUrl: './check-samples-samples.component.html',
  styleUrls: ['./check-samples-samples.component.scss'],
  imports: [
    BreadcrumbItemModule,
    BreadcrumbsModule,
    ButtonModule,
    CheckSamplesHeaderComponent,
    CheckSamplesSignatureSheetTableComponent,
    DividerModule,
    SpinnerModule,
    SubNavigationBarModule,
    TranslatePipe,
  ],
  providers: [DialogService],
})
export class CheckSamplesSamplesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);
  private readonly dialogService = inject(DialogService);

  protected readonly collectionTypes = CollectionType;
  protected collection?: Initiative | Referendum;
  protected loading = false;
  protected signatureSheets?: CollectionSignatureSheet[];

  private routeSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection }) => {
      this.collection = collection;
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

  protected async addSamples(): Promise<void> {
    if (!this.collection || !this.signatureSheets) {
      return;
    }

    const ref = this.dialogService.open(CheckSamplesAddSamplesDialogComponent, {
      collectionId: this.collection.id,
    } satisfies CheckSamplesAddSamplesDialogData);
    const result = (await firstValueFrom(ref.afterClosed())) as CheckSamplesAddSamplesDialogResult;
    if (!result?.sheets) {
      return;
    }

    this.signatureSheets = [...this.signatureSheets, ...result.sheets];
  }

  private async loadData(): Promise<void> {
    if (!this.collection) {
      return;
    }

    try {
      this.loading = true;
      this.signatureSheets = await this.collectionSignatureSheetService.listSamples(this.collection.id);
    } finally {
      this.loading = false;
    }
  }
}
