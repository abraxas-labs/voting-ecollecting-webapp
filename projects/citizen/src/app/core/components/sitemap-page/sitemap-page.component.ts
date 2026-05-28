/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { LinkModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { endedCollectionsUrl, launchInitiativeUrl, seekReferendumUrl, signCollectionUrl } from '../../../user/user.routes';
import { overviewUrl, userUrl } from '../../../app.routes';

@Component({
  selector: 'app-sitemap-page',
  templateUrl: './sitemap-page.component.html',
  imports: [LinkModule, TranslatePipe, RouterLink],
})
export class SitemapPageComponent {
  protected readonly overviewUrl = `/${overviewUrl}`;
  protected readonly signCollectionsUrl = `/${userUrl}/${signCollectionUrl}`;
  protected readonly launchInitiativeUrl = `/${userUrl}/${launchInitiativeUrl}`;
  protected readonly seekReferendumUrl = `/${userUrl}/${seekReferendumUrl}`;
  protected readonly endedCollectionsUrl = `/${userUrl}/${endedCollectionsUrl}`;
}
