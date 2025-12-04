/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { DayDiffPipe } from '../../pipes/day-diff.pipe';
import { StatusLabelModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionPeriodState } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'vo-ecol-collection-period-state-label',
  imports: [DayDiffPipe, StatusLabelModule, TranslatePipe],
  templateUrl: './collection-period-state-label.component.html',
})
export class CollectionPeriodStateLabelComponent {
  protected readonly now = new Date();
  protected readonly collectionPeriodStates: typeof CollectionPeriodState = CollectionPeriodState;

  @Input({ required: true })
  public state: CollectionPeriodState = CollectionPeriodState.COLLECTION_PERIOD_STATE_UNSPECIFIED;

  @Input({ required: true })
  public collectionStartDate?: Date;

  @Input({ required: true })
  public collectionEndDate?: Date;
}
