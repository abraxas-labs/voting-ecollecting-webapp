/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
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
import { Initiative } from '../../../core/models/initiative.model';
import { EnumItemDescription } from '@abraxas/voting-lib';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EnumItemDescriptionUtils } from 'ecollecting-lib';
import { DatePipe } from '@angular/common';
import { AdmissibilityDecisionState } from '@abraxas/voting-ecollecting-proto/admin';

@Component({
  selector: 'app-admissibility-decisions-table',
  imports: [TableModule, TooltipModule, TranslatePipe, StatusLabelModule, DatePipe, IconButtonModule, TruncateWithTooltipModule],
  templateUrl: './admissibility-decisions-table.component.html',
})
export class AdmissibilityDecisionsTableComponent implements AfterViewInit {
  protected readonly domainOfInfluenceTypeColumn = 'domainOfInfluenceType';
  protected readonly subTypeColumn = 'subType';
  protected readonly descriptionColumn = 'description';
  protected readonly collectionStartDateColumn = 'collectionStartDate';
  protected readonly collectionEndDateColumn = 'collectionEndDate';
  protected readonly admissibilityDecisionStateColumn = 'admissibilityDecisionState';
  protected readonly actionsColumn = 'actions';

  protected readonly columns = [
    this.domainOfInfluenceTypeColumn,
    this.subTypeColumn,
    this.descriptionColumn,
    this.collectionStartDateColumn,
    this.collectionEndDateColumn,
    this.admissibilityDecisionStateColumn,
    this.actionsColumn,
  ] as const;

  protected readonly dataSource = new TableDataSource<Initiative>();
  protected readonly domainOfInfluenceTypes: EnumItemDescription<DomainOfInfluenceType>[];
  protected readonly admissibilityDecisionStates: EnumItemDescription<AdmissibilityDecisionState>[];
  protected subTypes: string[] = [];

  protected readonly defaultSubTypeDescription: string;

  @Input({ required: true })
  public set data(d: Initiative[]) {
    this.dataSource.data = d;
    this.subTypes = Array.from(new Set(d.map(x => x.subType?.description ?? this.defaultSubTypeDescription)));
  }

  @Output()
  public edit: EventEmitter<Initiative> = new EventEmitter<Initiative>();

  @Output()
  public delete: EventEmitter<Initiative> = new EventEmitter<Initiative>();

  @Output()
  public openInitiative: EventEmitter<Initiative> = new EventEmitter<Initiative>();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  constructor() {
    const i18n = inject(TranslateService);
    const enumItemDescriptionUtils = inject(EnumItemDescriptionUtils);

    this.defaultSubTypeDescription = i18n.instant('ADMIN.ADMISSIBILITY_DECISIONS.SUB_TYPE_DEFAULT');
    this.domainOfInfluenceTypes = enumItemDescriptionUtils.getArrayWithDescriptions<DomainOfInfluenceType>(
      DomainOfInfluenceType,
      'DOMAIN_OF_INFLUENCE.TYPES.',
    );

    this.admissibilityDecisionStates = enumItemDescriptionUtils.getArrayWithDescriptions<AdmissibilityDecisionState>(
      AdmissibilityDecisionState,
      'ADMISSIBILITY_DECISION_STATES.',
    );

    this.dataSource.sortingDataAccessor = this.dataSource.filterDataAccessor = (row, property) => {
      const col = property as unknown as (typeof this.columns)[number];
      switch (col) {
        case this.collectionStartDateColumn:
          return row.collection.collectionStartDate;
        case this.collectionEndDateColumn:
          return row.collection.collectionEndDate;
        case this.subTypeColumn:
          return row.subType?.description ?? this.defaultSubTypeDescription;
        case this.descriptionColumn:
          return row.collection.description;
        default:
          return (row as any)[col];
      }
    };
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filter;
  }
}
