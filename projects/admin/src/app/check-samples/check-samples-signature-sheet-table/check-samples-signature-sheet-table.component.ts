/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import {
  AuthenticationService,
  ButtonModule,
  IconButtonModule,
  IconModule,
  SortDirective,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { CollectionSignatureSheet } from '../../core/models/collection.model';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { CollectionCount, sum, ToastService } from 'ecollecting-lib';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';
import { CollectionSignatureSheetState } from '@abraxas/voting-ecollecting-proto/admin';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-check-samples-signature-sheet-table',
  templateUrl: './check-samples-signature-sheet-table.component.html',
  styleUrls: ['./check-samples-signature-sheet-table.component.scss'],
  imports: [
    TableModule,
    TranslatePipe,
    TruncateWithTooltipModule,
    StatusLabelModule,
    DecimalPipe,
    IconButtonModule,
    ButtonModule,
    MatMenu,
    MatMenuTrigger,
    IconModule,
    DatePipe,
    MatMenuItem,
  ],
})
export class CheckSamplesSignatureSheetTableComponent implements AfterViewInit {
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly bfsColumn = 'bfs';
  protected readonly municipalityNameColumn = 'municipalityName';
  protected readonly numberColumn = 'number';
  protected readonly receivedAtColumn = 'receivedAt';
  protected readonly signatureCountTotalColumn = 'signatureCountTotal';
  protected readonly signatureCountValidColumn = 'signatureCountValid';
  protected readonly signatureCountInvalidColumn = 'signatureCountInvalid';
  protected readonly modifiedByNameColumn = 'modifiedByName';
  protected readonly stateColumn = 'state';
  protected readonly actionsColumn = 'actions';
  protected readonly collectionSignatureSheetStates = CollectionSignatureSheetState;

  protected columns = [
    this.bfsColumn,
    this.municipalityNameColumn,
    this.numberColumn,
    this.receivedAtColumn,
    this.signatureCountTotalColumn,
    this.signatureCountValidColumn,
    this.signatureCountInvalidColumn,
    this.modifiedByNameColumn,
    this.stateColumn,
    this.actionsColumn,
  ];
  protected dataSource = new TableDataSource<CollectionSignatureSheet>();
  protected footerSignatureCountTotal = 0;
  protected footerSignatureCountValid = 0;
  protected footerSignatureCountInvalid = 0;

  @Input({ required: true })
  public set signatureSheets(signatureSheets: CollectionSignatureSheet[]) {
    this.dataSource.data = signatureSheets;
    this.updateFooterTotals();
  }

  @Input({ required: true })
  public collectionId!: string;

  @Input()
  public showActionsColumn: boolean = true;

  @Input()
  public sortByStateAndMunicipalityName: boolean = false;

  @Output()
  public collectionCountChanged: EventEmitter<CollectionCount> = new EventEmitter();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  public ngAfterViewInit(): void {
    if (!this.showActionsColumn) {
      this.columns = this.columns.filter(x => x !== this.actionsColumn);
    }

    this.dataSource.sortingDataAccessor = (row, property) => {
      const col = property as unknown as (typeof this.columns)[number];
      switch (col) {
        case this.signatureCountTotalColumn:
          return row.count.total;
        case this.signatureCountValidColumn:
          return row.count.valid;
        case this.signatureCountInvalidColumn:
          return row.count.invalid;
        default:
          return (row as any)[col];
      }
    };

    this.dataSource.sort = this.sort;
  }

  protected async submit(signatureSheet: CollectionSignatureSheet): Promise<void> {
    const userProfile = await this.auth.getUserProfile();
    const result = await this.collectionSignatureSheetService.submit(this.collectionId, signatureSheet.id);
    signatureSheet.state = CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_SUBMITTED;
    signatureSheet.userPermissions = result.userPermissions!;
    signatureSheet.modifiedByName = userProfile.info.name;
    this.updateFooterTotals();
    this.toast.success('COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.SUBMITTED');
    this.collectionCountChanged.emit(result.collectionCount!);
  }

  protected async unsubmit(signatureSheet: CollectionSignatureSheet): Promise<void> {
    const userProfile = await this.auth.getUserProfile();
    const result = await this.collectionSignatureSheetService.unsubmit(this.collectionId, signatureSheet.id);
    signatureSheet.state = CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_ATTESTED;
    signatureSheet.userPermissions = result.userPermissions!;
    signatureSheet.modifiedByName = userProfile.info.name;
    this.updateFooterTotals();
    this.toast.success('COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.UNSUBMITTED');
    this.collectionCountChanged.emit(result.collectionCount!);
  }

  protected async discard(signatureSheet: CollectionSignatureSheet): Promise<void> {
    const userProfile = await this.auth.getUserProfile();
    const result = await this.collectionSignatureSheetService.discard(this.collectionId, signatureSheet.id);
    signatureSheet.state = CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_NOT_SUBMITTED;
    signatureSheet.userPermissions = result.userPermissions!;
    signatureSheet.modifiedByName = userProfile.info.name;
    this.updateFooterTotals();
    this.toast.success('COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DISCARDED');
  }

  protected async restore(signatureSheet: CollectionSignatureSheet): Promise<void> {
    const userProfile = await this.auth.getUserProfile();
    const result = await this.collectionSignatureSheetService.restore(this.collectionId, signatureSheet.id);
    signatureSheet.state = CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_ATTESTED;
    signatureSheet.userPermissions = result.userPermissions!;
    signatureSheet.modifiedByName = userProfile.info.name;
    this.updateFooterTotals();
    this.toast.success('COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.RESTORED');
  }

  protected async openSignatureSheet(signatureSheet: CollectionSignatureSheet): Promise<void> {
    await this.router.navigate([signatureSheet.id], { relativeTo: this.route });
  }

  private updateFooterTotals(): void {
    this.footerSignatureCountTotal = sum(
      this.dataSource.data
        .filter(x => x.state !== CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_NOT_SUBMITTED)
        .map(x => x.count.total),
    );
    this.footerSignatureCountValid = sum(
      this.dataSource.data
        .filter(x => x.state !== CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_NOT_SUBMITTED)
        .map(x => x.count.valid),
    );
    this.footerSignatureCountInvalid = sum(
      this.dataSource.data
        .filter(x => x.state !== CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_NOT_SUBMITTED)
        .map(x => x.count.invalid),
    );
  }
}
