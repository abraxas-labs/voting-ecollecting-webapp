/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input } from '@angular/core';
import { CardModule, IconButtonModule } from '@abraxas/base-components';
import { ExplainerVideo } from '../../models/explainer-video.model';
import { TranslatePipe } from '@ngx-translate/core';
import { VideoPlayerDialogComponent, VideoPlayerDialogData } from '../video-player-dialog/video-player-dialog.component';
import { CustomDialogService } from 'ecollecting-lib';

@Component({
  selector: 'app-explainer-video',
  templateUrl: './explainer-video.component.html',
  imports: [CardModule, IconButtonModule, TranslatePipe],
})
export class ExplainerVideoComponent {
  private readonly customDialogService = inject(CustomDialogService);

  @Input({ required: true })
  public explainerVideo!: ExplainerVideo;

  @Input()
  public headingLevel: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h3';

  protected openVideo(explainerVideo: ExplainerVideo): void {
    const dialogData: VideoPlayerDialogData = {
      title: explainerVideo.title,
      videoId: explainerVideo.videoId,
      videoIdWithSignLanguage: explainerVideo.videoIdWithSignLanguage,
    };
    this.customDialogService.openWithoutAutoFocus(VideoPlayerDialogComponent, dialogData, '60rem');
  }
}
