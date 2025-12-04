/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { DomainOfInfluenceService } from '../../core/services/domain-of-influence.service';
import { DomainOfInfluence } from '../../core/models/domain-of-influence.model';
import { DomainOfInfluenceSettingsComponent } from './domain-of-influence-settings/domain-of-influence-settings.component';
import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerModule } from '@abraxas/base-components';

@Component({
  selector: 'app-settings',
  imports: [DomainOfInfluenceSettingsComponent, TranslatePipe, SpinnerModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  protected domainOfInfluences: DomainOfInfluence[] = [];
  protected loading: boolean = true;

  public async ngOnInit(): Promise<void> {
    try {
      this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, undefined, false);
    } finally {
      this.loading = false;
    }
  }
}
