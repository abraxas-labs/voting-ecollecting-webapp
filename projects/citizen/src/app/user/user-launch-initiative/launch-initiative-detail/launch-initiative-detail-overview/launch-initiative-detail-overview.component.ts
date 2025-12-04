/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { CardModule } from '@abraxas/base-components';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-launch-initiative-detail-overview',
  templateUrl: './launch-initiative-detail-overview.component.html',
  imports: [CardModule, TranslatePipe, TranslateDirective],
})
export class LaunchInitiativeDetailOverviewComponent {}
