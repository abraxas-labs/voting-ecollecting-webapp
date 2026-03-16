/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SegmentedControl, SegmentedControlGroupModule } from '@abraxas/base-components';
import { CollectionPeriodState, CollectionState } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'vo-ecol-collection-filter',
  templateUrl: './collection-filter.component.html',
  styleUrl: './collection-filter.component.scss',
  imports: [TranslateModule, SegmentedControlGroupModule],
})
export class CollectionFilterComponent implements OnChanges {
  private readonly i18n = inject(TranslateService);

  @Output()
  public filterChange: EventEmitter<CollectionFilter> = new EventEmitter<CollectionFilter>();

  @Input()
  public initialActiveFilterId?: string;

  @Input()
  public initialActiveSubFilterId?: string;

  @Input({ required: true })
  public filters!: CollectionMainFilter[];

  protected filterControls: SegmentedControl[] = [];
  protected subFilterControls: SegmentedControl[] = [];

  protected activeFilter!: CollectionMainFilter;
  protected activeSubFilter?: CollectionSubFilter;

  public ngOnChanges() {
    // Create new filter object instances to update the active filter correctly if the filters array has changed,
    // otherwise the base component will not register a change in the active filter.
    this.filters = this.filters.map(x => ({ ...x }));

    for (const filter of Object.values(this.filters)) {
      if (!filter.autoSubFilters) {
        continue;
      }

      filter.subFilters = filter.criteria
        ?.filter(s => !s.state || !s.periodState)
        .map(
          s =>
            ({
              id: s.state
                ? CollectionState[s.state].substring('COLLECTION_STATE_'.length)
                : CollectionPeriodState[s.periodState!].substring('COLLECTION_PERIOD_STATE_'.length),
              criteria: [s],
            }) satisfies CollectionSubFilter,
        );
      filter.subFilters = [
        {
          id: 'ALL',
          criteria: [...filter.criteria],
        },
        ...(filter.subFilters ?? []),
      ];
    }

    this.filterControls = this.filters.map(value => ({
      value,
      disabled: false,
      displayText: this.i18n.instant('COLLECTION.FILTER.' + value.id),
    }));
    this.activeFilter = this.filterControls[0].value;
    this.setSubFilters();

    if (!this.initialActiveFilterId) {
      return;
    }

    this.activeFilter = this.filters.find(x => x.id === this.initialActiveFilterId) ?? this.filters[0];
    this.setSubFilters();
    if (!this.initialActiveSubFilterId) {
      this.emitFilter();
      return;
    }

    this.activeSubFilter =
      this.subFilterControls.find(x => x.value.id === this.initialActiveSubFilterId)?.value ?? this.subFilterControls[0]?.value;
    this.emitFilter();
  }

  public setActiveFilter(filter: CollectionMainFilter): void {
    if (this.activeFilter === filter) {
      return;
    }

    this.activeFilter = filter;
    this.setSubFilters();
    this.emitFilter();
  }

  private setSubFilters(): void {
    if (!this.activeFilter.subFilters) {
      this.subFilterControls = [];
      delete this.activeSubFilter;
      return;
    }

    this.subFilterControls = this.activeFilter.subFilters.map(value => ({
      value,
      disabled: false,
      displayText: this.i18n.instant('COLLECTION.FILTER.SUB.' + value.id),
    }));
    this.activeSubFilter = this.subFilterControls[0]?.value;
  }

  protected setActiveSubFilter(activeFilter: CollectionSubFilter): void {
    this.activeSubFilter = activeFilter;
    this.emitFilter();
  }

  protected emitFilter(): void {
    this.filterChange.emit({
      id: this.activeFilter.id,
      subId: this.activeSubFilter?.id,
      criteria: this.activeSubFilter?.criteria ?? this.activeFilter.criteria,
    });
  }
}

export interface CollectionFilter {
  id: string;
  subId?: string;
  criteria: CollectionFilterCriteria[];
}

export interface CollectionMainFilter {
  id: string;
  criteria: CollectionFilterCriteria[];

  autoSubFilters?: boolean;
  subFilters?: CollectionSubFilter[];
}

export interface CollectionSubFilter {
  id: string;
  criteria: CollectionFilterCriteria[];
}

export interface CollectionFilterCriteria {
  state?: CollectionState;
  periodState?: CollectionPeriodState;
}
