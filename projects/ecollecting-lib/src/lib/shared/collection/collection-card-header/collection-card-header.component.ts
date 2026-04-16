/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { CardModule, IconButtonModule, ReadonlyModule, StatusLabelModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { Collection } from '../../models/collection.model';
import { CollectionPeriodStateLabelComponent } from '../collection-period-state-label/collection-period-state-label.component';
import { CollectionPermissionRole, CollectionState, CollectionType, DecreeState } from '@abraxas/voting-ecollecting-proto';
import { Decree } from '../../models/decree.model';
import { InitiativeSubType } from '../../models/initiative.model';
import { collectionStateColorMap, decreeStateColorMap } from '../../../core/utils/color-state.utils';

@Component({
  selector: 'vo-ecol-collection-card-header',
  imports: [CardModule, IconButtonModule, ReadonlyModule, StatusLabelModule, TranslatePipe, CollectionPeriodStateLabelComponent],
  templateUrl: './collection-card-header.component.html',
  styleUrl: './collection-card-header.component.scss',
})
export class CollectionCardHeaderComponent {
  private collectionOrDecreeValue!: Collection | Decree;
  protected readonly decreeStates = DecreeState;
  protected readonly collectionStates = CollectionState;
  protected readonly collectionTypes = CollectionType;
  protected readonly collectionStateColorMap = collectionStateColorMap;
  protected readonly decreeStateColorMap = decreeStateColorMap;

  @Input()
  public showType: boolean = false;

  @Input()
  public showState: boolean = true;

  @Input()
  public showPeriodState: boolean = true;

  @Input()
  public role?: CollectionPermissionRole;

  @Input({ required: true })
  public set collectionOrDecree(v: Collection | Decree) {
    this.collectionOrDecreeValue = v;

    delete this.collection;
    delete this.decree;
    if (this.isCollection(this.collectionOrDecree)) {
      this.collection = this.collectionOrDecree;
    } else {
      this.decree = this.collectionOrDecree;
    }
  }

  public get collectionOrDecree(): Collection | Decree {
    return this.collectionOrDecreeValue;
  }

  @Input()
  public collectionStartDate?: Date;

  @Input()
  public collectionEndDate?: Date;

  @Input()
  public subType?: InitiativeSubType;

  @Input()
  public headingLevel: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h4';

  protected collection?: Collection;
  protected decree?: Decree;

  protected openLink(link: string): void {
    window.open(link, '_blank', 'noreferrer');
  }

  private isCollection(col: Collection | Decree): col is Collection {
    return (col as any).type !== undefined;
  }
}
