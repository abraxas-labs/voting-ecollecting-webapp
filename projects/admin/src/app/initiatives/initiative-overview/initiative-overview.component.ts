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
import { InitiativeService } from '../../core/services/initiative.service';
import { Initiative, InitiativeGroup } from '../../core/models/initiative.model';
import {
  CollectionFilter,
  CollectionFilterComponent,
  CollectionMainFilter,
  ConfirmDialogService,
  DoiTypeCardComponent,
  DomainOfInfluence,
  InitiativeCardComponent,
  MunicipalityFilterComponent,
  persistentStorage,
  storageKeyPrefix,
  ToastService,
} from 'ecollecting-lib';
import { CollectionPeriodState, CollectionState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { CollectionService } from '../../core/services/collection.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DomainOfInfluenceService } from '../../core/services/domain-of-influence.service';
import { firstValueFrom } from 'rxjs';
import { cloneDeep } from 'lodash';
import { signatureSheetsUrl } from '../../signature-sheets/signature-sheets.routes';
import { checkSamplesUrl } from '../../check-samples/check-samples.routes';
import {
  CollectionFinishDialogComponent,
  CollectionFinishDialogData,
  CollectionFinishDialogResult,
} from '../../core/components/collection-finish-dialog/collection-finish-dialog.component';
import { environment } from '../../../environments/environment';

const filterStorageKey = storageKeyPrefix + 'initiative-filter';
const subFilterStorageKey = storageKeyPrefix + 'initiative-sub-filter';
const bfsFilterStorageKey = storageKeyPrefix + 'initiative-bfs-filter';

@Component({
  selector: 'app-initiative-overview',
  templateUrl: './initiative-overview.component.html',
  styleUrls: ['./initiative-overview.component.scss'],
  imports: [
    VotingLibModule,
    StatusLabelModule,
    TranslateModule,
    CardModule,
    IconButtonModule,
    ReadonlyModule,
    InitiativeCardComponent,
    CollectionFilterComponent,
    DoiTypeCardComponent,
    MunicipalityFilterComponent,
    AlertBarModule,
    ButtonModule,
    SpinnerModule,
  ],
  providers: [DialogService],
})
export class InitiativeOverviewComponent implements OnInit {
  private readonly initiativeService = inject(InitiativeService);
  private readonly collectionService = inject(CollectionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly doiService = inject(DomainOfInfluenceService);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  protected readonly collectionStates = CollectionState;
  protected filters: CollectionMainFilter[] = [
    {
      id: 'COLLECTING',
      periodStates: [CollectionPeriodState.COLLECTION_PERIOD_STATE_PUBLISHED, CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION],
    },
    {
      id: 'COLLECTION_DONE',
      periodStates: [CollectionPeriodState.COLLECTION_PERIOD_STATE_EXPIRED],
    },
    {
      id: 'ALL',
      states: [
        CollectionState.COLLECTION_STATE_PRE_RECORDED,
        CollectionState.COLLECTION_STATE_IN_PREPARATION,
        CollectionState.COLLECTION_STATE_SUBMITTED,
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
      id: 'ARCHIVE',
      states: [
        CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT,
        CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT,
        CollectionState.COLLECTION_STATE_NOT_PASSED,
        CollectionState.COLLECTION_STATE_WITHDRAWN,
      ],
      autoSubFilters: true,
    },
  ];

  protected loading = false;
  protected generatingDocumentIds: Set<string> = new Set();
  protected loadingMunicipalityInitiatives = false;
  protected groups: InitiativeGroup[] = [];
  protected filteredGroups: InitiativeGroup[] = [];
  protected filter?: CollectionFilter;

  protected readonly municipalityDoiType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU;

  protected municipalities: DomainOfInfluence[] = [];
  protected selectedMunicipality?: DomainOfInfluence;

  protected initialFilterId = persistentStorage.getItem(filterStorageKey) ?? 'ALL';
  protected initialSubFilterId = persistentStorage.getItem(subFilterStorageKey) ?? 'ALL';
  protected initialBfsFilter = persistentStorage.getItem(bfsFilterStorageKey);

  public async ngOnInit(): Promise<void> {
    const doiTypes = await this.doiService.listOwnTypes();
    if (environment.enableMunicipalityReviewProcess || !doiTypes.includes(DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU)) {
      this.filters = [
        {
          id: 'PREPARING',
          states: [
            CollectionState.COLLECTION_STATE_PRE_RECORDED,
            CollectionState.COLLECTION_STATE_IN_PREPARATION,
            CollectionState.COLLECTION_STATE_RETURNED_FOR_CORRECTION,
            CollectionState.COLLECTION_STATE_READY_FOR_REGISTRATION,
          ],
          autoSubFilters: true,
        },
        {
          id: 'TASKS',
          states: [
            CollectionState.COLLECTION_STATE_SUBMITTED,
            CollectionState.COLLECTION_STATE_UNDER_REVIEW,
            CollectionState.COLLECTION_STATE_REGISTERED,
            CollectionState.COLLECTION_STATE_PREPARING_FOR_COLLECTION,
            CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED,
          ],
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
    this.filteredGroups = cloneDeep(this.groups);
    this.applyInitiativeFilter();
  }

  protected async open(initiativeId: string): Promise<void> {
    await this.router.navigate([initiativeId], { relativeTo: this.route });
  }

  protected async delete(initiativeId: string, group: InitiativeGroup): Promise<void> {
    const ok = await this.confirmDialogService.confirm({
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    await this.collectionService.deleteWithdrawn(initiativeId);
    this.toast.success('APP.DELETED');
    group.initiatives = group.initiatives.filter(initiative => initiative.id !== initiativeId);

    const originalGroup = this.groups.find(g => g.domainOfInfluenceType === group.domainOfInfluenceType);
    if (originalGroup) {
      originalGroup.initiatives = originalGroup.initiatives.filter(initiative => initiative.id !== initiativeId);
    }
  }

  protected async applyFilter(): Promise<void> {
    this.filteredGroups = cloneDeep(this.groups);
    await this.applyMunicipalityFilter();
    this.applyInitiativeFilter();
  }

  protected async openSignatureSheets(initiativeId: string): Promise<void> {
    await this.router.navigate([initiativeId, signatureSheetsUrl], { relativeTo: this.route });
  }

  protected async submitSignatureSheets(initiative: Initiative): Promise<void> {
    const response = await this.collectionService.submitSignatureSheets(initiative.id);
    initiative.collection.state = CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED;
    initiative.collection.userPermissions = response.userPermissions;
  }

  protected async checkSamples(initiativeId: string): Promise<void> {
    await this.router.navigate([initiativeId, checkSamplesUrl], { relativeTo: this.route });
  }

  protected async finish(initiative: Initiative): Promise<void> {
    const ref = this.dialogService.open(CollectionFinishDialogComponent, {
      minSignatureCount: initiative.minSignatureCount,
      electronicCitizenCount: initiative.collection.attestedCollectionCount?.electronicCitizenCount ?? 0,
      totalCitizenCount: initiative.collection.attestedCollectionCount?.totalCitizenCount ?? 0,
      collectionCounts: [{ ...initiative.collection.attestedCollectionCount, description: initiative.collection.description }],
    } as CollectionFinishDialogData);
    const result = (await firstValueFrom(ref.afterClosed())) as CollectionFinishDialogResult;
    if (!result) {
      return;
    }

    if (result.cameAbout) {
      await this.initiativeService.cameAbout(initiative.id, result.sensitiveDataExpiryDate);
      this.setState(initiative, CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT);
    } else {
      await this.initiativeService.cameNotAbout(initiative.id, result.sensitiveDataExpiryDate, result.cameNotAboutReason!);
      this.setState(initiative, CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT);
    }
  }

  protected async generateDocuments(initiative: Initiative): Promise<void> {
    try {
      this.generatingDocumentIds.add(initiative.id);
      await this.initiativeService.downloadDocuments(initiative.id);
    } finally {
      this.generatingDocumentIds.delete(initiative.id);
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      [this.municipalities, this.groups] = await Promise.all([
        this.doiService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]),
        this.initiativeService.list([DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH, DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT]),
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

  private applyInitiativeFilter() {
    if (!this.filter) {
      return;
    }

    for (const group of this.filteredGroups) {
      if (this.filter.periodStates !== undefined) {
        group.initiatives = group.initiatives.filter(i => this.filter!.periodStates!.includes(i.collection.periodState));
      }

      if (this.filter.states !== undefined) {
        group.initiatives = group.initiatives.filter(i => this.filter!.states!.includes(i.collection.state));
      }
    }
  }

  private async applyMunicipalityFilter(): Promise<void> {
    if (!this.selectedMunicipality) {
      persistentStorage.removeItem(bfsFilterStorageKey);
      const filteredMunicipalityGroup = this.filteredGroups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      if (!filteredMunicipalityGroup) {
        return;
      }

      filteredMunicipalityGroup.initiatives = [];
      return;
    }

    persistentStorage.setItem(bfsFilterStorageKey, this.selectedMunicipality.bfs);

    try {
      this.loadingMunicipalityInitiatives = true;
      const groups = await this.initiativeService.list([this.municipalityDoiType], this.selectedMunicipality.bfs);
      const municipalityGroup = groups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      const originalMunicipalityGroup = this.groups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      const filteredMunicipalityGroup = this.filteredGroups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      if (!originalMunicipalityGroup || !filteredMunicipalityGroup) {
        return;
      }

      originalMunicipalityGroup.initiatives = municipalityGroup?.initiatives ?? [];
      filteredMunicipalityGroup.initiatives = cloneDeep(originalMunicipalityGroup.initiatives);
    } finally {
      this.loadingMunicipalityInitiatives = false;
    }
  }

  private setState(initiative: Initiative, state: CollectionState): void {
    initiative.collection.state = state;

    if (initiative.collection.userPermissions) {
      initiative.collection.userPermissions.canFinish = false;
    }
  }
}
