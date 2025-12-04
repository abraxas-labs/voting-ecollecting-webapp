/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { ExpansionPanelModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'vo-ecol-doi-type-card',
  imports: [ExpansionPanelModule, TranslatePipe],
  templateUrl: './doi-type-card.component.html',
  styleUrl: './doi-type-card.component.scss',
})
export class DoiTypeCardComponent {
  protected readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  @Input({ required: true })
  public doiType: DomainOfInfluenceType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED;
}
