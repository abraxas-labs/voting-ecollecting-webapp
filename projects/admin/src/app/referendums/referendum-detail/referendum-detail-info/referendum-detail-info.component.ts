/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { LabelModule, LinkModule, ReadonlyModule } from '@abraxas/base-components';
import { Referendum } from '../../../core/models/referendum.model';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-referendum-detail-info',
  imports: [ReadonlyModule, TranslatePipe, LabelModule, LinkModule],
  templateUrl: './referendum-detail-info.component.html',
})
export class ReferendumDetailInfoComponent {
  @Input({ required: true })
  public referendum!: Referendum;
}
