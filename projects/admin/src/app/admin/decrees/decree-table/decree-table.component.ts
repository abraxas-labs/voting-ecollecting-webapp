/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Decree } from '../../../core/models/decree.model';
import {
  FilterDirective,
  IconButtonModule,
  SortDirective,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { DatePipe, DecimalPipe } from '@angular/common';
import { EnumItemDescription } from '@abraxas/voting-lib';
import { CollectionPeriodState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { EnumItemDescriptionUtils } from 'ecollecting-lib';

@Component({
  selector: 'app-decree-table',
  templateUrl: './decree-table.component.html',
  styleUrls: ['./decree-table.component.scss'],
  imports: [
    TranslateModule,
    IconButtonModule,
    TableModule,
    StatusLabelModule,
    DatePipe,
    DecimalPipe,
    TooltipModule,
    TruncateWithTooltipModule,
  ],
})
export class DecreeTableComponent implements AfterViewInit {
  protected readonly domainOfInfluenceTypeColumn = 'domainOfInfluenceType';
  protected readonly domainOfInfluenceNameColumn = 'domainOfInfluenceName';
  protected readonly descriptionColumn = 'description';
  protected readonly collectionStartDateColumn = 'collectionStartDate';
  protected readonly collectionEndDateColumn = 'collectionEndDate';
  protected readonly minSignatureCountColumn = 'minSignatureCount';
  protected readonly totalAttestedColumn = 'totalAttested';
  protected readonly maxElectronicSignatureCountColumn = 'maxElectronicSignatureCount';
  protected readonly electronicAttestedColumn = 'electronicAttested';
  protected readonly stateColumn = 'state';
  protected readonly editColumn = 'edit';

  public readonly columns = [
    this.domainOfInfluenceTypeColumn,
    this.domainOfInfluenceNameColumn,
    this.descriptionColumn,
    this.collectionStartDateColumn,
    this.collectionEndDateColumn,
    this.minSignatureCountColumn,
    this.totalAttestedColumn,
    this.maxElectronicSignatureCountColumn,
    this.electronicAttestedColumn,
    this.stateColumn,
    this.editColumn,
  ];

  @Input()
  public set decrees(decrees: Decree[]) {
    this.dataSource.data = decrees;
  }

  @Output()
  public decreeSelected: EventEmitter<Decree> = new EventEmitter();

  @Output()
  public deleteDecree: EventEmitter<Decree> = new EventEmitter();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  public dataSource = new TableDataSource<Decree>();
  public domainOfInfluenceTypes: EnumItemDescription<DomainOfInfluenceType>[];
  public states: EnumItemDescription<CollectionPeriodState>[];

  constructor() {
    const enumItemDescriptionUtil = inject(EnumItemDescriptionUtils);

    this.domainOfInfluenceTypes = enumItemDescriptionUtil.getArrayWithDescriptions<DomainOfInfluenceType>(
      DomainOfInfluenceType,
      'DOMAIN_OF_INFLUENCE.TYPES.',
    );

    this.states = enumItemDescriptionUtil.getArrayWithDescriptions<CollectionPeriodState>(
      CollectionPeriodState,
      'DECREE.COLLECTION_PERIOD_STATES.',
    );

    this.dataSource.sortingDataAccessor = this.dataSource.filterDataAccessor = (row, property) => {
      const col = property as unknown as (typeof this.columns)[number];
      switch (col) {
        case this.totalAttestedColumn:
          return this.getTotalAttestedCount(row);
        case this.electronicAttestedColumn:
          return this.getElectronicAttestedCount(row);
        default:
          return (row as any)[col];
      }
    };
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  public isDisabled(decree: Decree): boolean {
    return !decree.userPermissions?.canEdit;
  }

  protected getTotalAttestedCount(decree: Decree): number {
    return decree.attestedCollectionCount?.totalCitizenCount ?? 0;
  }

  protected getElectronicAttestedCount(decree: Decree): number {
    return decree.attestedCollectionCount?.electronicCitizenCount ?? 0;
  }
}
