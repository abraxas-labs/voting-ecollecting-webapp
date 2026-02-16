/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, TemplateRef, inject } from '@angular/core';
import { DividerModule, ExpansionPanelModule, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DoiTypeCardComponent,
  DomainOfInfluence,
  DecreeCardComponent,
  MunicipalityFilterComponent,
  persistentStorage,
  storageKeyPrefix,
} from 'ecollecting-lib';
import { Decree } from '../../../core/models/decree.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { NgTemplateOutlet } from '@angular/common';
import { ReferendumService } from '../../../core/services/referendum.service';
import { DomainOfInfluenceService } from '../../../core/services/domain-of-influence.service';

const bfsFilterStorageKey = storageKeyPrefix + 'referendum-bfs-filter';

@Component({
  selector: 'app-referendum-doi-type-card',
  imports: [
    ExpansionPanelModule,
    TranslatePipe,
    MunicipalityFilterComponent,
    DividerModule,
    ReadonlyModule,
    NgTemplateOutlet,
    DecreeCardComponent,
    DoiTypeCardComponent,
    SpinnerModule,
  ],
  templateUrl: './decree-doi-type-card.component.html',
})
export class DecreeDoiTypeCardComponent implements OnInit, OnChanges {
  private readonly referendumService = inject(ReferendumService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  protected readonly municipalityDoiType: DomainOfInfluenceType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU;

  @Input({ required: true })
  public doiType: DomainOfInfluenceType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED;

  @Input({ required: true })
  public decrees: Decree[] = [];

  @Input()
  public cardContent?: TemplateRef<{ $implicit: Decree }>;

  @Input()
  public selectedDecreeId?: string;

  @Input()
  public originalSelectedDecreeId?: string;

  @Input()
  public selectable = false;

  @Input()
  public includeReferendums = true;

  @Output()
  public cardClick = new EventEmitter<Decree>();

  protected selectedDomainOfInfluence?: DomainOfInfluence;

  protected filteredDecrees: Decree[] = [];
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
    await this.applyFilter();
  }

  public async applyFilter(): Promise<void> {
    if (this.doiType !== this.municipalityDoiType) {
      this.filteredDecrees = this.decrees;
      return;
    }

    if (this.selectedDomainOfInfluence === undefined) {
      persistentStorage.removeItem(bfsFilterStorageKey);
      this.filteredDecrees = [];
      return;
    }

    persistentStorage.setItem(bfsFilterStorageKey, this.selectedDomainOfInfluence.bfs);

    try {
      this.loading = true;
      const groups = await this.referendumService.listDecreesEligibleForReferendum(
        this.includeReferendums,
        [this.municipalityDoiType],
        this.selectedDomainOfInfluence.bfs,
      );
      const municipalityGroup = groups.find(x => x.domainOfInfluenceType === this.municipalityDoiType);
      this.filteredDecrees = municipalityGroup?.decrees ?? [];
    } finally {
      this.loading = false;
    }
  }
}
