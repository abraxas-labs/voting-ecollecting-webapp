/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AutocompleteModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';

import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DOMAIN_OF_INFLUENCE_SERVICE_TOKEN, DomainOfInfluenceService } from '../../core/domain-of-influence.service';
import { DomainOfInfluence } from '../models/domain-of-influence.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'vo-ecol-municipality-filter',
  templateUrl: './municipality-filter.component.html',
  imports: [AutocompleteModule, TranslateModule, ReactiveFormsModule, FormsModule],
})
export class MunicipalityFilterComponent<T extends DomainOfInfluence = DomainOfInfluence> implements OnInit {
  private readonly domainOfInfluenceService = inject<DomainOfInfluenceService<T>>(DOMAIN_OF_INFLUENCE_SERVICE_TOKEN);

  @Input()
  public domainOfInfluences?: T[];

  @Input()
  public selectedDomainOfInfluence?: T;

  @Input()
  public showHint: boolean = true;

  @Input()
  public onlyECollectingEnabled: boolean = false;

  @Input()
  public control?: FormControl;

  @Output()
  public selectedDomainOfInfluenceChange = new EventEmitter<T | undefined>();

  public async ngOnInit(): Promise<void> {
    if (!this.domainOfInfluences) {
      this.domainOfInfluences = await this.domainOfInfluenceService.list(this.onlyECollectingEnabled ? true : undefined, [
        DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU,
      ]);
      this.domainOfInfluences = this.domainOfInfluences.some(x => x.eCollectingEnabled) ? this.domainOfInfluences : [];
    }
  }

  public selectDoi(bfs?: string): void {
    if (!bfs) {
      this.selectedDomainOfInfluenceChange.emit(undefined);
      return;
    }

    const doi = this.domainOfInfluences?.find(d => d.bfs === bfs);
    if (doi && doi !== this.selectedDomainOfInfluence) {
      this.selectedDomainOfInfluence = doi;
      this.selectedDomainOfInfluenceChange.emit(doi);
    }
  }
}
