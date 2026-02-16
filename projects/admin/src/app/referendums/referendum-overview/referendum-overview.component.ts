/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import { VotingLibModule } from '@abraxas/voting-lib';
import {
  AlertBarModule,
  ButtonModule,
  CardModule,
  DialogService,
  IconButtonModule,
  ReadonlyModule,
  SpinnerModule,
  StatusLabelModule,
} from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { DecreeGroup, Referendum } from '../../core/models/referendum.model';
import {
  CollectionFilter,
  CollectionFilterComponent,
  CollectionMainFilter,
  ConfirmDialogService,
  DecreeCardComponent,
  DoiTypeCardComponent,
  MunicipalityFilterComponent,
  persistentStorage,
  ReferendumCardComponent,
  storageKeyPrefix,
  ToastService,
} from 'ecollecting-lib';
import { ReferendumService } from '../../core/services/referendum.service';
import { cloneDeep } from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionPeriodState, CollectionState, DecreeState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { DomainOfInfluenceService } from '../../core/services/domain-of-influence.service';
import { firstValueFrom } from 'rxjs';
import { CollectionService } from '../../core/services/collection.service';
import { Decree } from '../../core/models/decree.model';
import { checkSamplesUrl } from '../../check-samples/check-samples.routes';
import { signatureSheetsUrl } from '../../signature-sheets/signature-sheets.routes';
import {
  CollectionFinishDialogComponent,
  CollectionFinishDialogData,
  CollectionFinishDialogResult,
} from '../../core/components/collection-finish-dialog/collection-finish-dialog.component';
import { DecreeService } from '../../core/services/decree.service';
import {
  ReferendumNewDialogComponent,
  ReferendumNewDialogData,
  ReferendumNewDialogResult,
} from '../referendum-new-dialog/referendum-new-dialog.component';
import { DomainOfInfluence } from '../../core/models/domain-of-influence.model';
import { environment } from '../../../environments/environment';

const filterStorageKey = storageKeyPrefix + 'referendum-filter';
const subFilterStorageKey = storageKeyPrefix + 'referendum-sub-filter';
const bfsFilterStorageKey = storageKeyPrefix + 'referendum-bfs-filter';

@Component({
  selector: 'app-referendum-overview',
  templateUrl: './referendum-overview.component.html',
  styleUrls: ['./referendum-overview.component.scss'],
  imports: [
    DoiTypeCardComponent,
    VotingLibModule,
    StatusLabelModule,
    TranslateModule,
    CardModule,
    IconButtonModule,
    ReadonlyModule,
    DecreeCardComponent,
    ReferendumCardComponent,
    MunicipalityFilterComponent,
    AlertBarModule,
    ButtonModule,
    CollectionFilterComponent,
    SpinnerModule,
  ],
  providers: [DialogService],
})
export class ReferendumOverviewComponent implements OnInit {
  private readonly referendumService = inject(ReferendumService);
  private readonly collectionService = inject(CollectionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly doiService = inject(DomainOfInfluenceService);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly decreeService = inject(DecreeService);
  private readonly collectingFilterId = 'COLLECTING';
  private readonly collectionDoneFilterId = 'COLLECTION_DONE';
  private readonly allFilterId = 'ALL';
  private readonly archiveFilterId = 'ARCHIVE';
  private readonly preparingFilterId = 'PREPARING';
  private readonly tasksFilterId = 'TASKS';

  protected readonly municipalityDoiType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU;
  protected readonly collectionStates = CollectionState;
  protected filters: CollectionMainFilter[] = [
    {
      id: this.collectingFilterId,
      periodStates: [CollectionPeriodState.COLLECTION_PERIOD_STATE_PUBLISHED, CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION],
    },
    {
      id: this.collectionDoneFilterId,
      periodStates: [CollectionPeriodState.COLLECTION_PERIOD_STATE_EXPIRED],
    },
    {
      id: this.allFilterId,
      periodStates: [CollectionPeriodState.COLLECTION_PERIOD_STATE_PUBLISHED, CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION],
      states: [
        CollectionState.COLLECTION_STATE_PRE_RECORDED,
        CollectionState.COLLECTION_STATE_IN_PREPARATION,
        CollectionState.COLLECTION_STATE_SUBMITTED,
        CollectionState.COLLECTION_STATE_NOT_PASSED,
        CollectionState.COLLECTION_STATE_RETURNED_FOR_CORRECTION,
        CollectionState.COLLECTION_STATE_UNDER_REVIEW,
        CollectionState.COLLECTION_STATE_READY_FOR_REGISTRATION,
        CollectionState.COLLECTION_STATE_REGISTERED,
        CollectionState.COLLECTION_STATE_PREPARING_FOR_COLLECTION,
        CollectionState.COLLECTION_STATE_ENABLED_FOR_COLLECTION,
        CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED,
      ],
    },
    {
      id: this.archiveFilterId,
      states: [
        CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT,
        CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT,
        CollectionState.COLLECTION_STATE_WITHDRAWN,
      ],
      autoSubFilters: true,
    },
  ];

  protected loading: boolean = false;
  protected loadingMunicipalityReferendums: boolean = false;
  protected decreeGroups: DecreeGroup[] = [];
  protected filteredDecreeGroups: DecreeGroup[] = [];
  protected filter?: CollectionFilter;

  protected municipalities: DomainOfInfluence[] = [];
  protected selectedMunicipality?: DomainOfInfluence;
  protected generatingDocumentIds: Set<string> = new Set();

  protected initialFilterId = persistentStorage.getItem(filterStorageKey) ?? 'ALL';
  protected initialSubFilterId = persistentStorage.getItem(subFilterStorageKey) ?? 'ALL';
  protected initialBfsFilter = persistentStorage.getItem(bfsFilterStorageKey);

  public async ngOnInit(): Promise<void> {
    const doiTypes = await this.doiService.listOwnTypes();
    if (environment.enableMunicipalityReviewProcess || !doiTypes.includes(DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU)) {
      this.filters = [
        {
          id: this.preparingFilterId,
          states: [CollectionState.COLLECTION_STATE_PRE_RECORDED, CollectionState.COLLECTION_STATE_IN_PREPARATION],
          autoSubFilters: true,
        },
        {
          id: this.tasksFilterId,
          states: [CollectionState.COLLECTION_STATE_PREPARING_FOR_COLLECTION, CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED],
          autoSubFilters: true,
        },
        ...this.filters,
      ];
    }

    await this.loadData();
  }

  protected async filterChange(filter: CollectionFilter): Promise<void> {
    persistentStorage.setItem(filterStorageKey, filter.id);
    persistentStorage.setItem(subFilterStorageKey, filter.subId ?? '');
    this.filter = filter;
    this.filteredDecreeGroups = cloneDeep(this.decreeGroups);
    this.applyReferendumFilter();
    this.removeEmptyDecrees();
  }

  protected async open(referendumId: string): Promise<void> {
    await this.router.navigate([referendumId], { relativeTo: this.route });
  }

  protected async delete(referendumId: string, group: DecreeGroup, decree: Decree): Promise<void> {
    const ok = await this.confirmDialogService.confirm({
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    await this.collectionService.deleteWithdrawn(referendumId);
    this.toast.success('APP.DELETED');

    decree.collections = decree.collections!.filter(x => x.id !== referendumId);
    if (decree.collections.length === 0) {
      group.decrees = group.decrees.filter(d => d.id !== decree.id);
    }

    const originalGroup = this.decreeGroups.find(x => x.domainOfInfluenceType === group.domainOfInfluenceType);
    if (originalGroup) {
      const originalDecree = originalGroup.decrees.find(d => d.id === decree.id);
      if (originalDecree) {
        originalDecree.collections = originalDecree.collections!.filter(x => x.id !== referendumId);
        if (originalDecree.collections.length === 0) {
          originalGroup.decrees = originalGroup.decrees.filter(d => d.id !== decree.id);
        }
      }
    }
  }

  protected async submitSignatureSheets(referendum: Referendum): Promise<void> {
    const response = await this.collectionService.submitSignatureSheets(referendum.id);
    referendum.collection.state = CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED;
    referendum.collection.userPermissions = response.userPermissions;
  }

  protected async checkSamples(referendumId: string): Promise<void> {
    await this.router.navigate([referendumId, checkSamplesUrl], { relativeTo: this.route });
  }

  protected async addSignatureSheet(referendumId: string): Promise<void> {
    await this.router.navigate([referendumId, signatureSheetsUrl], { relativeTo: this.route });
  }

  protected async applyFilter(): Promise<void> {
    this.filteredDecreeGroups = cloneDeep(this.decreeGroups);
    await this.applyMunicipalityFilter();
    this.applyReferendumFilter();
    this.removeEmptyDecrees();
  }

  protected async finish(decree: Decree): Promise<void> {
    const ref = this.dialogService.open(CollectionFinishDialogComponent, {
      minSignatureCount: decree.minSignatureCount,
      electronicCitizenCount: decree.attestedCollectionCount?.electronicCitizenCount ?? 0,
      totalCitizenCount: decree.attestedCollectionCount?.totalCitizenCount ?? 0,
      collectionCounts: decree.collections?.map(x => ({ ...x.collection.attestedCollectionCount, description: x.collection.description })),
    } as CollectionFinishDialogData);
    const result = (await firstValueFrom(ref.afterClosed())) as CollectionFinishDialogResult;
    if (!result) {
      return;
    }

    if (result.cameAbout) {
      await this.decreeService.cameAbout(decree.id, result.sensitiveDataExpiryDate);
      this.setState(decree, DecreeState.DECREE_STATE_ENDED_CAME_ABOUT, CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT);
    } else {
      await this.decreeService.cameNotAbout(decree.id, result.sensitiveDataExpiryDate, result.cameNotAboutReason!);
      this.setState(decree, DecreeState.DECREE_STATE_ENDED_CAME_NOT_ABOUT, CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT);
    }
  }

  protected async generateDocuments(decree: Decree): Promise<void> {
    try {
      this.generatingDocumentIds.add(decree.id);
      await this.decreeService.downloadDocuments(decree.id);
    } finally {
      this.generatingDocumentIds.delete(decree.id);
    }
  }

  protected async addCollection(decree: Decree): Promise<void> {
    const ref = this.dialogService.open(ReferendumNewDialogComponent, {
      decree: decree,
    } satisfies ReferendumNewDialogData);
    const result = (await firstValueFrom(ref.afterClosed())) as ReferendumNewDialogResult;
    if (!result) {
      return;
    }

    const createdReferendum = await this.referendumService.get(result.referendumId);
    decree.collections ??= [];
    decree.collections.push(createdReferendum);
  }

  private setState(decree: Decree, state: DecreeState, collectionState: CollectionState): void {
    decree.state = state;

    if (decree.userPermissions) {
      decree.userPermissions.canFinish = false;
    }

    if (!decree.collections) {
      return;
    }

    for (const referendum of decree.collections) {
      referendum.collection.state = collectionState;
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      [this.municipalities, this.decreeGroups] = await Promise.all([
        this.doiService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]),
        this.referendumService.listDecrees([
          DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH,
          DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT,
        ]),
      ]);

      if (this.initialBfsFilter) {
        this.selectedMunicipality = this.municipalities.find(x => x.bfs === this.initialBfsFilter);
      }

      if (this.municipalities.length === 1) {
        this.selectedMunicipality = this.municipalities[0];
      }

      await this.applyFilter();
    } finally {
      this.loading = false;
    }
  }

  private applyReferendumFilter() {
    if (!this.filter) {
      return;
    }

    for (const group of this.filteredDecreeGroups) {
      if (this.filter.periodStates !== undefined) {
        group.decrees = group.decrees.filter(d => d.periodState !== undefined && this.filter!.periodStates!.includes(d.periodState));
      }

      if (this.filter.states !== undefined) {
        for (const decree of group.decrees) {
          decree.collections = decree.collections?.filter(c => this.filter!.states!.includes(c.collection.state));
        }
      }
    }
  }

  private async applyMunicipalityFilter(): Promise<void> {
    if (!this.selectedMunicipality) {
      persistentStorage.removeItem(bfsFilterStorageKey);
      const filteredMunicipalityGroup = this.filteredDecreeGroups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      if (!filteredMunicipalityGroup) {
        return;
      }

      filteredMunicipalityGroup.decrees = [];
      return;
    }

    persistentStorage.setItem(bfsFilterStorageKey, this.selectedMunicipality.bfs);

    try {
      this.loadingMunicipalityReferendums = true;
      const groups = await this.referendumService.listDecrees([this.municipalityDoiType], this.selectedMunicipality.bfs);
      const municipalityGroup = groups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      const originalMunicipalityGroup = this.decreeGroups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      const filteredMunicipalityGroup = this.filteredDecreeGroups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      if (!originalMunicipalityGroup || !filteredMunicipalityGroup) {
        return;
      }

      originalMunicipalityGroup.decrees = municipalityGroup?.decrees ?? [];
      filteredMunicipalityGroup.decrees = cloneDeep(originalMunicipalityGroup.decrees);
    } finally {
      this.loadingMunicipalityReferendums = false;
    }
  }

  private removeEmptyDecrees(): void {
    if (
      !this.filter ||
      this.filter.id === this.allFilterId ||
      this.filter.id === this.collectionDoneFilterId ||
      this.filter.id === this.collectingFilterId
    ) {
      return;
    }

    for (const group of this.filteredDecreeGroups) {
      group.decrees = group.decrees.filter(g => g.collections!.length > 0);
    }
  }
}
