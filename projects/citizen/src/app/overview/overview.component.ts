/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { CardModule, DialogService, DividerModule, IconButtonModule, IconModule, LinkModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { OverviewNavigationComponent } from './overview-navigation/overview-navigation.component';
import { SignCollectionOverviewComponent } from '../user/sign-collection/sign-collection-overview/sign-collection-overview.component';
import { VideoPlayerDialogComponent, VideoPlayerDialogData } from './video-player-dialog/video-player-dialog.component';

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
  ],
})
export class OverviewComponent {
  private readonly dialogService = inject(DialogService);

  public explainerVideos: ExplainerVideo[] = [
    {
      title: 'OVERVIEW.EXPLAINER_VIDEO.SIGN_COLLECTION.TITLE',
      description: 'OVERVIEW.EXPLAINER_VIDEO.SIGN_COLLECTION.DESCRIPTION',
      ariaLabel: 'OVERVIEW.EXPLAINER_VIDEO.SIGN_COLLECTION.ARIA_LABEL',
      videoId: '4mHFDNTarvJTfriyKHoCQE',
    },
    {
      title: 'OVERVIEW.EXPLAINER_VIDEO.SEEK_REFERENDUM.TITLE',
      description: 'OVERVIEW.EXPLAINER_VIDEO.SEEK_REFERENDUM.DESCRIPTION',
      ariaLabel: 'OVERVIEW.EXPLAINER_VIDEO.SEEK_REFERENDUM.ARIA_LABEL',
      videoId: '4mHFDNTarvJTfriyKHoCQE',
    },
    {
      title: 'OVERVIEW.EXPLAINER_VIDEO.LAUNCH_INITIATIVE.TITLE',
      description: 'OVERVIEW.EXPLAINER_VIDEO.LAUNCH_INITIATIVE.DESCRIPTION',
      ariaLabel: 'OVERVIEW.EXPLAINER_VIDEO.LAUNCH_INITIATIVE.ARIA_LABEL',
      videoId: '4mHFDNTarvJTfriyKHoCQE',
    },
  ];

  protected openVideo(explainerVideo: ExplainerVideo): void {
    const dialogData: VideoPlayerDialogData = {
      title: explainerVideo.title,
      videoId: explainerVideo.videoId,
    };
    this.dialogService.open(VideoPlayerDialogComponent, dialogData, '60rem');
  }
}

export interface ExplainerVideo {
  title: string;
  description: string;
  ariaLabel: string;
  videoId: string;
}
