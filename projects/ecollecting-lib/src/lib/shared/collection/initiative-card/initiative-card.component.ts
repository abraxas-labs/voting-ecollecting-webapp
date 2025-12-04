/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CardModule, IconButtonModule, ReadonlyModule, StatusLabelModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { Initiative } from '../../models/initiative.model';
import { CollectionCardHeaderComponent } from '../collection-card-header/collection-card-header.component';
import { CollectionPermissionRole } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'vo-ecol-initiative-card',
  templateUrl: './initiative-card.component.html',
  styleUrls: ['./initiative-card.component.scss'],
  imports: [
    StatusLabelModule,
    TranslateModule,
    CardModule,
    IconButtonModule,
    DatePipe,
    ReadonlyModule,
    DecimalPipe,
    CollectionCardHeaderComponent,
  ],
})
export class InitiativeCardComponent {
  @Input({ required: true })
  public initiative!: Initiative;

  @Input()
  public role?: CollectionPermissionRole;

  @Input()
  public showPeriodState: boolean = true;

  @Output()
  public cardClick: EventEmitter<void> = new EventEmitter<void>();
}
