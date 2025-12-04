/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { IconButtonModule, NavBarModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { endedCollectionsUrl, launchInitiativeUrl, seekReferendumUrl } from '../../user/user.routes';

@Component({
  selector: 'app-overview-navigation',
  templateUrl: './overview-navigation.component.html',
  imports: [IconButtonModule, NavBarModule, TranslatePipe],
})
export class OverviewNavigationComponent {
  protected readonly launchInitiativeUrl = launchInitiativeUrl;
  protected readonly seekReferendumUrl = seekReferendumUrl;
  protected readonly endedCollectionsUrl = endedCollectionsUrl;
}
