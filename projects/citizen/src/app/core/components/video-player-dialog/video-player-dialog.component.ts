/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DialogModule, IconButtonModule, SwitchModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';

export const VIDEO_PLAYER_CONFIG = {
  playerId: '8C25CAFYu6uMir__Rk5k75',
  channelId: '107728',
  configType: 'vmpro',
  flashPath: '//e.video-cdn.net/v2/',
  apiUrl: '//d.video-cdn.net/play',
} as const;

const VIDEO_EMBED_SCRIPT_SRC = 'https://e.video-cdn.net/v2/embed.js';
const VIDEO_PLAYER_EMBED_ATTRIBUTE = ['mi', '24-video-player'].join('');

/** Minimal typing for the public API exposed by the video embed script. */
interface VideoPlayerCollection {
  addPlayerById(id: string): boolean;
  removePlayerById(id: string): void;
}

@Component({
  selector: 'app-video-player-dialog',
  templateUrl: './video-player-dialog.component.html',
  styleUrls: ['./video-player-dialog.component.scss'],
  imports: [DialogModule, IconButtonModule, TranslatePipe, MatDialogClose, SwitchModule],
})
export class VideoPlayerDialogComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  protected readonly playerConfig = VIDEO_PLAYER_CONFIG;
  protected readonly title: string;
  protected readonly videoId: string;
  protected readonly videoIdWithSignLanguage: string;
  protected readonly playerElementId = `video-player-${++VideoPlayerDialogComponent.playerCounter}`;

  private static embedScriptPromise?: Promise<void>;
  private static playerCounter = 0;

  protected withSignLanguage = false;
  private destroyed = false;
  private playerCreated = false;

  constructor() {
    const dialogData = inject<VideoPlayerDialogData>(MAT_DIALOG_DATA);
    this.title = dialogData.title;
    this.videoId = dialogData.videoId;
    this.videoIdWithSignLanguage = dialogData.videoIdWithSignLanguage;
  }

  public async ngAfterViewInit(): Promise<void> {
    await this.loadNewPlayer();
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
    if (!this.playerCreated) {
      return;
    }
    try {
      this.getPlayerCollection()?.removePlayerById(this.playerElementId);
    } catch {
      // The player may already have been torn down; nothing to clean up.
    }
  }

  protected async onWithSignLanguageChange(event: boolean): Promise<void> {
    this.withSignLanguage = event;
    await this.loadNewPlayer();
  }

  private async loadNewPlayer(): Promise<void> {
    this.createNewPlayerContainer();

    try {
      await this.loadVideoEmbed();
    } catch {
      return;
    }

    if (this.destroyed) {
      return;
    }

    try {
      this.getPlayerCollection()?.addPlayerById(this.playerElementId);
      this.playerCreated = true;
    } catch {
      this.playerCreated = false;
    }
  }

  private getPlayer(): { Collection?: VideoPlayerCollection } | undefined {
    return (this.document.defaultView as unknown as { VideoPlayer?: { Collection?: VideoPlayerCollection } } | null)?.VideoPlayer;
  }

  private getPlayerCollection(): VideoPlayerCollection | undefined {
    return this.getPlayer()?.Collection;
  }

  private createNewPlayerContainer(): void {
    const newContainer = this.document.createElement('div');
    newContainer.id = this.playerElementId;
    newContainer.setAttribute('video-id', this.withSignLanguage ? this.videoIdWithSignLanguage : this.videoId);
    newContainer.setAttribute('player-id', this.playerConfig.playerId);
    newContainer.setAttribute('channel-id', this.playerConfig.channelId);
    newContainer.setAttribute('config-type', this.playerConfig.configType);
    newContainer.setAttribute('flash-path', this.playerConfig.flashPath);
    newContainer.setAttribute('api-url', this.playerConfig.apiUrl);
    newContainer.setAttribute('disable-auto-creation', 'true');
    newContainer.setAttribute('class', 'video-player');
    newContainer.setAttribute(VIDEO_PLAYER_EMBED_ATTRIBUTE, '');

    const oldContainer = this.document.getElementById(this.playerElementId);
    if (!oldContainer?.parentElement) {
      return;
    }
    oldContainer.parentElement.replaceChild(newContainer, oldContainer);
  }

  /**
   * Loads the video embed script once and resolves as soon as its public API is
   * available. The embed auto-scans the DOM for players only once (when the script first executes),
   * so subsequent players must be created explicitly.
   */
  private loadVideoEmbed(): Promise<void> {
    if (this.getPlayerCollection()) {
      return Promise.resolve();
    }

    VideoPlayerDialogComponent.embedScriptPromise ??= new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = VIDEO_EMBED_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        VideoPlayerDialogComponent.embedScriptPromise = undefined;
        reject(new Error('Failed to load the video embed script.'));
      };

      this.document.body.appendChild(script);
    });

    return VideoPlayerDialogComponent.embedScriptPromise;
  }
}

export interface VideoPlayerDialogData {
  title: string;
  videoId: string;
  videoIdWithSignLanguage: string;
}
