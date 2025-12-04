/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import {
  ButtonModule,
  FilterDirective,
  IconButtonModule,
  IconModule,
  SortDirective,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { CollectionMunicipality } from '../../core/models/collection.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { EnumItemDescription } from '@abraxas/voting-lib';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionCount, sum, ToastService } from 'ecollecting-lib';
import { CollectionMunicipalityService } from '../../core/services/collection-municipality.service';

@Component({
  selector: 'app-check-samples-municipality-table',
  templateUrl: './check-samples-municipality-table.component.html',
  styleUrls: ['./check-samples-municipality-table.component.scss'],
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
    MatMenuItem,
    IconModule,
  ],
})
export class CheckSamplesMunicipalityTableComponent implements AfterViewInit {
  private readonly translate = inject(TranslateService);
  private readonly collectionMunicipalityService = inject(CollectionMunicipalityService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly bfsColumn = 'bfs';
  protected readonly municipalityNameColumn = 'municipalityName';
  protected readonly totalSignatureSheetsCountColumn = 'totalSignatureSheetsCount';
  protected readonly totalSubmittedOrConfirmedSignatureSheetsCountColumn = 'totalSubmittedOrConfirmedSignatureSheetsCount';
  protected readonly totalNotSubmittedSignatureSheetsCountColumn = 'totalNotSubmittedSignatureSheetsCount';
  protected readonly totalConfirmedSignatureSheetsCountColumn = 'totalConfirmedSignatureSheetsCount';
  protected readonly physicalCountInvalidColumn = 'physicalCountInvalid';
  protected readonly physicalCountValidColumn = 'physicalCountValid';
  protected readonly electronicCitizenCountColumn = 'electronicCitizenCount';
  protected readonly totalValidCitizenCountColumn = 'totalValidCitizenCount';
  protected readonly isLockedColumn = 'isLocked';
  protected readonly actionsColumn = 'actions';
  protected readonly isLockedFilterItems: EnumItemDescription<boolean>[];

  protected columns = [
    this.bfsColumn,
    this.municipalityNameColumn,
    this.totalSignatureSheetsCountColumn,
    this.totalSubmittedOrConfirmedSignatureSheetsCountColumn,
    this.totalNotSubmittedSignatureSheetsCountColumn,
    this.totalConfirmedSignatureSheetsCountColumn,
    this.physicalCountInvalidColumn,
    this.physicalCountValidColumn,
    this.electronicCitizenCountColumn,
    this.totalValidCitizenCountColumn,
    this.isLockedColumn,
    this.actionsColumn,
  ];
  protected dataSource = new TableDataSource<CollectionMunicipality>();
  protected footerTotalSignatureSheetsCount = 0;
  protected footerTotalSubmittedOrConfirmedSignatureSheetsCount = 0;
  protected footerTotalNotSubmittedSignatureSheetsCount = 0;
  protected footerTotalConfirmedSignatureSheetsCount = 0;
  protected footerPhysicalCountInvalid = 0;
  protected footerPhysicalCountValid = 0;
  protected footerElectronicCitizenCount = 0;
  protected footerTotalValidCitizenCount = 0;

  @Input({ required: true })
  public set municipalities(municipalities: CollectionMunicipality[]) {
    this.dataSource.data = municipalities;
    this.updateFooterTotals();
  }

  @Input({ required: true })
  public collectionId!: string;

  @Output()
  public collectionCountChanged: EventEmitter<CollectionCount> = new EventEmitter();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  constructor() {
    this.isLockedFilterItems = [
      {
        value: true,
        description: this.translate.instant('COLLECTION.CHECK_SAMPLES.TABLE.IS_LOCKED.true'),
      },
      {
        value: false,
        description: this.translate.instant('COLLECTION.CHECK_SAMPLES.TABLE.IS_LOCKED.false'),
      },
    ];
  }

  public ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = this.dataSource.filterDataAccessor = (row, property) => {
      const col = property as unknown as (typeof this.columns)[number];
      switch (col) {
        case this.physicalCountInvalidColumn:
          return row.physicalCount.invalid;
        case this.physicalCountValidColumn:
          return row.physicalCount.valid;
        case this.totalSignatureSheetsCountColumn:
          return row.signatureSheetsCount.totalSignatureSheetsCount;
        case this.totalSubmittedOrConfirmedSignatureSheetsCountColumn:
          return row.signatureSheetsCount.totalSubmittedOrConfirmedSignatureSheetsCount;
        case this.totalNotSubmittedSignatureSheetsCountColumn:
          return row.signatureSheetsCount.totalNotSubmittedSignatureSheetsCount;
        case this.totalConfirmedSignatureSheetsCountColumn:
          return row.signatureSheetsCount.totalConfirmedSignatureSheetsCount;
        default:
          return (row as any)[col];
      }
    };

    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  protected async unlock(collectionMunicipality: CollectionMunicipality): Promise<void> {
    await this.collectionMunicipalityService.unlock(this.collectionId, collectionMunicipality.bfs);
    collectionMunicipality.isLocked = false;
  }

  protected async lock(collectionMunicipality: CollectionMunicipality): Promise<void> {
    await this.collectionMunicipalityService.lock(this.collectionId, collectionMunicipality.bfs);
    collectionMunicipality.isLocked = true;
  }

  protected async openMunicipality(collectionMunicipality: CollectionMunicipality): Promise<void> {
    await this.router.navigate([collectionMunicipality.bfs], { relativeTo: this.route });
  }

  protected async submitMunicipalitySignatureSheets(collectionMunicipality: CollectionMunicipality): Promise<void> {
    const response = await this.collectionMunicipalityService.submitSignatureSheets(this.collectionId, collectionMunicipality.bfs);
    collectionMunicipality.signatureSheetsCount.totalSubmittedOrConfirmedSignatureSheetsCount =
      response.municipality.signatureSheetsCount.totalSubmittedOrConfirmedSignatureSheetsCount;
    collectionMunicipality.physicalCount = response.municipality.physicalCount;
    this.updateFooterTotals();
    this.toast.success('COLLECTION.CHECK_SAMPLES.TABLE.SIGNATURE_SHEETS_SUBMITTED');
    this.collectionCountChanged.emit(response.collectionCount);
  }

  private updateFooterTotals(): void {
    this.footerTotalSignatureSheetsCount = sum(this.dataSource.data.map(x => x.signatureSheetsCount.totalSignatureSheetsCount));
    this.footerTotalSubmittedOrConfirmedSignatureSheetsCount = sum(
      this.dataSource.data.map(x => x.signatureSheetsCount.totalSubmittedOrConfirmedSignatureSheetsCount),
    );
    this.footerTotalNotSubmittedSignatureSheetsCount = sum(
      this.dataSource.data.map(x => x.signatureSheetsCount.totalNotSubmittedSignatureSheetsCount),
    );
    this.footerTotalConfirmedSignatureSheetsCount = sum(
      this.dataSource.data.map(x => x.signatureSheetsCount.totalConfirmedSignatureSheetsCount),
    );
    this.footerPhysicalCountInvalid = sum(this.dataSource.data.map(x => x.physicalCount.invalid));
    this.footerPhysicalCountValid = sum(this.dataSource.data.map(x => x.physicalCount.valid));
    this.footerElectronicCitizenCount = sum(this.dataSource.data.map(x => x.electronicCitizenCount));
    this.footerTotalValidCitizenCount = sum(this.dataSource.data.map(x => x.totalValidCitizenCount));
  }
}
