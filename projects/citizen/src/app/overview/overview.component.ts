/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { CardModule, DividerModule, IconButtonModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { OverviewNavigationComponent } from './overview-navigation/overview-navigation.component';
import { SignCollectionOverviewComponent } from '../user/sign-collection/sign-collection-overview/sign-collection-overview.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  imports: [TranslateModule, CardModule, IconButtonModule, DividerModule, OverviewNavigationComponent, SignCollectionOverviewComponent],
})
export class OverviewComponent {
  public explainerVideos: ExplainerVideo[] = [
    {
      title: 'OVERVIEW.EXPLAINER_VIDEO.SIGN_COLLECTION.TITLE',
      description: 'OVERVIEW.EXPLAINER_VIDEO.SIGN_COLLECTION.DESCRIPTION',
      link: 'about:blank',
    },
    {
      title: 'OVERVIEW.EXPLAINER_VIDEO.SEEK_REFERENDUM.TITLE',
      description: 'OVERVIEW.EXPLAINER_VIDEO.SEEK_REFERENDUM.DESCRIPTION',
      link: 'about:blank',
    },
    {
      title: 'OVERVIEW.EXPLAINER_VIDEO.LAUNCH_INITIATIVE.TITLE',
      description: 'OVERVIEW.EXPLAINER_VIDEO.LAUNCH_INITIATIVE.DESCRIPTION',
      link: 'about:blank',
    },
  ];
}

export interface ExplainerVideo {
  title: string;
  description: string;
  link: string;
}
