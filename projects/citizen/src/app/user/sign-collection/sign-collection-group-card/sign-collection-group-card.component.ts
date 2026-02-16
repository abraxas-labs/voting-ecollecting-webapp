/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import {
  DecreeCardComponent,
  DoiTypeCardComponent,
  DomainOfInfluence,
  InitiativeCardComponent,
  MunicipalityFilterComponent,
  persistentStorage,
  ReferendumCardComponent,
  storageKeyPrefix,
} from 'ecollecting-lib';
import { CollectionsGroup } from '../../../core/models/collections-group.model';
import { Decree } from '../../../core/models/decree.model';
import { Initiative } from '../../../core/models/initiative.model';
import { TranslatePipe } from '@ngx-translate/core';
import { VotingLibModule } from '@abraxas/voting-lib';
import { CollectionPeriodState, CollectionType, DecreeState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { AlertBarModule, ButtonModule, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { SignCollectionExtensionComponent } from '../sign-collection-extension/sign-collection-extension.component';
import { Collection } from '../../../core/models/collection.model';
import { signInitiativeUrl, signReferendumUrl } from '../../user.routes';
import { Router } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { DomainOfInfluenceService } from '../../../core/services/domain-of-influence.service';

const bfsFilterStorageKey = storageKeyPrefix + 'collection-bfs-filter';

@Component({
  selector: 'app-sign-collection-group-card',
  imports: [
    DoiTypeCardComponent,
    TranslatePipe,
    DecreeCardComponent,
    VotingLibModule,
    MunicipalityFilterComponent,
    ButtonModule,
    ReadonlyModule,
    SignCollectionExtensionComponent,
    InitiativeCardComponent,
    ReferendumCardComponent,
    SpinnerModule,
    AlertBarModule,
  ],
  templateUrl: './sign-collection-group-card.component.html',
  styleUrl: './sign-collection-group-card.component.scss',
})
export class SignCollectionGroupCardComponent implements OnInit, OnChanges {
  private readonly router = inject(Router);
  private readonly collectionService = inject(CollectionService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  protected readonly municipalityDoiType: DomainOfInfluenceType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU;
  protected readonly decreeStates = DecreeState;
  protected readonly periodStates = CollectionPeriodState;

  @Input({ required: true })
  public group!: CollectionsGroup;

  @Input({ required: true })
  public periodState!: CollectionPeriodState;

  @Output()
  public groupChange: EventEmitter<CollectionsGroup> = new EventEmitter<CollectionsGroup>();

  protected selectedDomainOfInfluence?: DomainOfInfluence;

  protected initiatives: Initiative[] = [];
  protected referendumDecrees: Decree[] = [];
  protected loading = false;

  protected initialBfsFilter = persistentStorage.getItem(bfsFilterStorageKey);
  protected domainOfInfluences?: DomainOfInfluence[];

  public async ngOnInit(): Promise<void> {
    this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]);
    this.domainOfInfluences = this.domainOfInfluences.some(x => x.eCollectingEnabled) ? this.domainOfInfluences : [];

    if (this.initialBfsFilter) {
      this.selectedDomainOfInfluence = this.domainOfInfluences.find(x => x.bfs === this.initialBfsFilter);
    }

    await this.applyFilter();
  }

  public async ngOnChanges(): Promise<void> {
    this.referendumDecrees = this.group.referendums;
    this.initiatives = this.group.initiatives;
  }

  public async applyFilter(): Promise<void> {
    if (this.group.domainOfInfluenceType !== this.municipalityDoiType) {
      this.referendumDecrees = this.group.referendums;
      this.initiatives = this.group.initiatives;
      return;
    }

    if (this.selectedDomainOfInfluence === undefined) {
      persistentStorage.removeItem(bfsFilterStorageKey);
      this.referendumDecrees = [];
      this.initiatives = [];
      return;
    }

    persistentStorage.setItem(bfsFilterStorageKey, this.selectedDomainOfInfluence.bfs);

    try {
      this.loading = true;
      const groups = await this.collectionService.list(this.periodState, [this.municipalityDoiType], this.selectedDomainOfInfluence.bfs);
      const municipalityCollections = groups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      this.referendumDecrees = this.group.referendums = municipalityCollections?.referendums ?? [];
      this.initiatives = this.group.initiatives = municipalityCollections?.initiatives ?? [];
      this.groupChange.emit(this.group);
    } finally {
      this.loading = false;
    }
  }

  public async signOnline(collection: Collection): Promise<void> {
    const typeSegment = collection.type === CollectionType.COLLECTION_TYPE_REFERENDUM ? signReferendumUrl : signInitiativeUrl;
    await this.router.navigate(['-', 'user', typeSegment, collection.id]);
  }
}
