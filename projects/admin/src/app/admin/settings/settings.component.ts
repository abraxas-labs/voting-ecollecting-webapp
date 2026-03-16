/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import { DomainOfInfluenceService } from '../../core/services/domain-of-influence.service';
import { DomainOfInfluence } from '../../core/models/domain-of-influence.model';
import { DomainOfInfluenceSettingsComponent } from './domain-of-influence-settings/domain-of-influence-settings.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AutocompleteModule, IconModule, SpinnerModule } from '@abraxas/base-components';
import { FormsModule } from '@angular/forms';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-settings',
  imports: [DomainOfInfluenceSettingsComponent, TranslatePipe, SpinnerModule, AutocompleteModule, FormsModule, IconModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  protected domainOfInfluences: DomainOfInfluence[] = [];
  protected statusMessage?: 'saving' | 'saved';
  protected loading: boolean = true;
  protected selectedDoi?: DomainOfInfluence;

  public async ngOnInit(): Promise<void> {
    try {
      this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, undefined, true);
      this.removeInheritedValues(this.domainOfInfluences);
      this.selectedDoi = this.domainOfInfluences[0];
    } finally {
      this.loading = false;
    }
  }

  private removeInheritedValues(domainOfInfluences: DomainOfInfluence[]): void {
    for (const domainOfInfluence of domainOfInfluences) {
      switch (domainOfInfluence.type) {
        case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU:
          delete domainOfInfluence.settings.initiativeMaxElectronicSignaturePercent;
          delete domainOfInfluence.settings.referendumMaxElectronicSignaturePercent;
          break;
        case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT:
          delete domainOfInfluence.settings.initiativeMinSignatureCount;
          break;
        case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH:
          delete domainOfInfluence.settings.initiativeMaxElectronicSignaturePercent;
          delete domainOfInfluence.settings.initiativeMinSignatureCount;
          break;
      }
    }
  }
}
