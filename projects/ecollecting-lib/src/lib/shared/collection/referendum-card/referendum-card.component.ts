/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardModule, IconButtonModule, ReadonlyModule, StatusLabelModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { Referendum } from '../../models/referendum.model';
import { CollectionCardHeaderComponent } from '../collection-card-header/collection-card-header.component';
import { Decree } from '../../models/decree.model';
import { CollectionPermissionRole } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'vo-ecol-referendum-card',
  templateUrl: './referendum-card.component.html',
  imports: [StatusLabelModule, TranslateModule, CardModule, IconButtonModule, ReadonlyModule, CollectionCardHeaderComponent],
})
export class ReferendumCardComponent {
  @Input({ required: true })
  public referendum!: Referendum;

  @Input()
  public decree?: Decree;

  @Input()
  public clickable: boolean = false;

  @Input()
  public showState: boolean = true;

  @Input()
  public role?: CollectionPermissionRole;

  @Output()
  public cardClick: EventEmitter<void> = new EventEmitter<void>();
}
