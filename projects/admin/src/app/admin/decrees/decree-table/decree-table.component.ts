/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
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
import { collectionPeriodStateColorMap, EnumItemDescriptionUtils } from 'ecollecting-lib';

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
  protected readonly maxElectronicSignatureCountColumn = 'maxElectronicSignatureCount';
  protected readonly stateColumn = 'state';
  protected readonly editColumn = 'edit';

  public readonly defaultColumns = [
    this.domainOfInfluenceTypeColumn,
    this.domainOfInfluenceNameColumn,
    this.descriptionColumn,
    this.collectionStartDateColumn,
    this.collectionEndDateColumn,
    this.minSignatureCountColumn,
    this.stateColumn,
    this.editColumn,
  ];

  public columns: string[] = [...this.defaultColumns];

  protected readonly collectionPeriodStateColorMap = collectionPeriodStateColorMap;
  protected readonly collectionPeriodStates = CollectionPeriodState;

  @Input()
  public set decrees(decrees: Decree[]) {
    this.dataSource.data = decrees;
    this.updateColumns(decrees);
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
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }

  public isDisabled(decree: Decree): boolean {
    return !decree.userPermissions?.canEdit;
  }

  private updateColumns(decrees: Decree[]): void {
    if (decrees.some(d => d.electronicCollectionEnabled)) {
      const stateIndex = this.defaultColumns.indexOf(this.stateColumn);
      this.columns = [
        ...this.defaultColumns.slice(0, stateIndex),
        this.maxElectronicSignatureCountColumn,
        ...this.defaultColumns.slice(stateIndex),
      ];
    } else {
      this.columns = [...this.defaultColumns];
    }
  }
}
