/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnInit, inject } from '@angular/core';
import { VotingLibModule } from '@abraxas/voting-lib';
import { CollectionService } from '../../../core/services/collection.service';
import { SignCollectionGroupCardComponent } from '../sign-collection-group-card/sign-collection-group-card.component';
import { CollectionsGroup } from '../../../core/models/collections-group.model';
import { SpinnerModule } from '@abraxas/base-components';
import { CollectionPeriodState, CollectionState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { CollectionFilter, CollectionFilterComponent, CollectionMainFilter, persistentStorage, storageKeyPrefix } from 'ecollecting-lib';
import { cloneDeep } from 'lodash';

const filterStorageKey = storageKeyPrefix + 'collection-filter';

@Component({
  selector: 'app-sign-collection-overview',
  imports: [VotingLibModule, SignCollectionGroupCardComponent, SpinnerModule, CollectionFilterComponent],
  templateUrl: './sign-collection-overview.component.html',
  styleUrls: ['./sign-collection-overview.component.scss'],
})
export class SignCollectionOverviewComponent implements OnInit {
  private readonly collectionService = inject(CollectionService);

  protected readonly collectionPeriodStates = CollectionPeriodState;

  @Input()
  public showExpired: boolean = false;

  protected loading: boolean = false;
  protected collectionGroups: CollectionsGroup[] = [];
  protected filteredGroups: CollectionsGroup[] = [];

  protected initialFilterId = persistentStorage.getItem(filterStorageKey) ?? 'EXPIRED';
  protected filter?: CollectionFilter;

  protected readonly filters: CollectionMainFilter[] = [
    {
      id: 'EXPIRED',
      states: [CollectionState.COLLECTION_STATE_ENABLED_FOR_COLLECTION, CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED],
      periodStates: [CollectionPeriodState.COLLECTION_PERIOD_STATE_EXPIRED],
    },
    {
      id: 'ENDED_CAME_ABOUT',
      states: [CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT],
    },
    {
      id: 'ENDED_CAME_NOT_ABOUT',
      states: [CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT],
    },
  ];

  public async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const periodState = this.showExpired
        ? CollectionPeriodState.COLLECTION_PERIOD_STATE_UNSPECIFIED
        : CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION;
      this.collectionGroups = await this.collectionService.list(periodState, [
        DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH,
        DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT,
      ]);

      this.filteredGroups = cloneDeep(this.collectionGroups);
      if (this.showExpired) {
        this.filter = this.filters.find(x => x.id === (persistentStorage.getItem(filterStorageKey) ?? 'EXPIRED'));
        this.applyFilter();
      }
    } finally {
      this.loading = false;
    }
  }

  protected filterChange(filter: CollectionFilter): void {
    persistentStorage.setItem(filterStorageKey, filter.id);
    this.filter = filter;
    this.applyFilter();
  }

  protected groupChanged(group: CollectionsGroup): void {
    const originalGroup = this.collectionGroups.find(x => x.domainOfInfluenceType === group.domainOfInfluenceType);
    if (!originalGroup) {
      return;
    }

    originalGroup.initiatives = group.initiatives;
    originalGroup.referendums = group.referendums;

    this.applyFilter();
  }

  private applyFilter() {
    if (!this.filter) {
      return;
    }

    this.filteredGroups = cloneDeep(this.collectionGroups);

    for (const group of this.filteredGroups) {
      if (this.filter.periodStates !== undefined) {
        group.initiatives = group.initiatives.filter(i => this.filter!.periodStates!.includes(i.collection.periodState));
        group.referendums = group.referendums.filter(
          d => d.periodState !== undefined && this.filter!.periodStates!.includes(d.periodState),
        );
      }

      if (this.filter.states !== undefined) {
        group.initiatives = group.initiatives.filter(i => this.filter!.states!.includes(i.collection.state));
        for (const decree of group.referendums) {
          decree.collections = decree.collections?.filter(c => this.filter!.states!.includes(c.collection.state));
        }

        group.referendums = group.referendums.filter(d => d.collections && d.collections.length > 0);
      }
    }
  }
}
