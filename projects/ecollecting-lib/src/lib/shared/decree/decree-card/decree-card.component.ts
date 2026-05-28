/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardModule, IconButtonModule, ReadonlyModule, StatusLabelModule } from '@abraxas/base-components';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Decree } from '../../models/decree.model';
import { CollectionCardHeaderComponent } from '../../collection/collection-card-header/collection-card-header.component';

@Component({
  selector: 'vo-ecol-decree-card',
  imports: [
    CardModule,
    DatePipe,
    IconButtonModule,
    ReadonlyModule,
    StatusLabelModule,
    TranslatePipe,
    DecimalPipe,
    CollectionCardHeaderComponent,
  ],
  templateUrl: './decree-card.component.html',
  styleUrl: './decree-card.component.scss',
})
export class DecreeCardComponent {
  @Input({ required: true })
  public decree!: Decree;

  @Input()
  public showState = false;

  @Input()
  public showType = false;

  @Input()
  public selected = false;

  @Input()
  public disabled = false;

  @Input()
  public clickable = false;

  @Input({ required: true })
  public showElectronicCounters = true;

  @Input()
  public headingLevel: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h4';

  @Output()
  public cardClick = new EventEmitter();
}
