/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnInit } from '@angular/core';
import { ExpansionPanelModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { persistentStorage, storageKeyPrefix } from '../../core/storage';

const expandedDoiTypeStorageKey = storageKeyPrefix + 'expanded-doi-type';

@Component({
  selector: 'vo-ecol-doi-type-card',
  imports: [ExpansionPanelModule, TranslatePipe],
  templateUrl: './doi-type-card.component.html',
})
export class DoiTypeCardComponent implements OnInit {
  @Input({ required: true })
  public doiType: DomainOfInfluenceType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED;

  @Input()
  public saveExpandedState = false;

  protected savedExpandedDoiTypes: DomainOfInfluenceType[] = [];

  public ngOnInit(): void {
    if (!this.saveExpandedState) {
      return;
    }

    this.savedExpandedDoiTypes = this.getSavedExpandedDoiTypes();
  }

  protected expandedChanged(expanded: boolean) {
    if (!this.saveExpandedState) {
      return;
    }

    this.savedExpandedDoiTypes = this.getSavedExpandedDoiTypes();

    // don't save the doi type if it is already saved
    if (expanded && this.savedExpandedDoiTypes.includes(this.doiType)) {
      return;
    }

    if (expanded) {
      this.savedExpandedDoiTypes.push(this.doiType);
    } else {
      this.savedExpandedDoiTypes = this.savedExpandedDoiTypes.filter(x => x !== this.doiType);
    }

    persistentStorage.setItem(expandedDoiTypeStorageKey, JSON.stringify(this.savedExpandedDoiTypes));
  }

  private getSavedExpandedDoiTypes(): DomainOfInfluenceType[] {
    const storedValue = persistentStorage.getItem(expandedDoiTypeStorageKey);
    if (!storedValue) {
      return [];
    }

    return JSON.parse(storedValue);
  }
}
