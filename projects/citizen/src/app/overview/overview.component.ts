/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { CardModule, DividerModule, IconButtonModule, IconModule, LinkModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { OverviewNavigationComponent } from './overview-navigation/overview-navigation.component';
import { SignCollectionOverviewComponent } from '../user/sign-collection/sign-collection-overview/sign-collection-overview.component';
import { explainerVideos } from '../core/models/explainer-video.model';
import { ExplainerVideoComponent } from '../core/components/explainer-video/explainer-video.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  imports: [
    TranslateModule,
    CardModule,
    IconModule,
    DividerModule,
    OverviewNavigationComponent,
    SignCollectionOverviewComponent,
    LinkModule,
    IconButtonModule,
    ExplainerVideoComponent,
  ],
})
export class OverviewComponent {
  protected readonly explainerVideos = explainerVideos;
}
