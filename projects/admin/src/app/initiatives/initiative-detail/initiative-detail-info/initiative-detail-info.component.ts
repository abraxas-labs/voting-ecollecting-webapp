/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { LabelModule, LinkModule, ReadonlyModule } from '@abraxas/base-components';
import { Initiative } from '../../../core/models/initiative.model';
import { TranslatePipe } from '@ngx-translate/core';
import { MarkdownPreviewComponent } from '@abraxas/voting-lib';

@Component({
  selector: 'app-initiative-detail-info',
  imports: [ReadonlyModule, TranslatePipe, LabelModule, LinkModule, MarkdownPreviewComponent],
  templateUrl: './initiative-detail-info.component.html',
})
export class InitiativeDetailInfoComponent {
  @Input({ required: true })
  public initiative!: Initiative;
}
