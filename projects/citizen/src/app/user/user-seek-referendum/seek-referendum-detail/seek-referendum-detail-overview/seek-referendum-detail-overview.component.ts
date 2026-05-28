/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';
import { CardModule } from '@abraxas/base-components';

@Component({
  selector: 'app-seek-referendum-detail-overview',
  templateUrl: './seek-referendum-detail-overview.component.html',
  styleUrl: 'seek-referendum-detail-overview.component.scss',
  imports: [TranslateDirective, CardModule],
})
export class SeekReferendumDetailOverviewComponent {}
