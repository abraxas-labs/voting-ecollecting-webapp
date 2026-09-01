/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { CardModule, DialogModule, IconButtonModule, LinkModule } from '@abraxas/base-components';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { MatDialogClose } from '@angular/material/dialog';
import { explainerVideos } from '../../core/models/explainer-video.model';
import { ExplainerVideoComponent } from '../../core/components/explainer-video/explainer-video.component';

@Component({
  selector: 'app-user-help-menu-dialog',
  templateUrl: './user-help-menu-dialog.component.html',
  imports: [
    DialogModule,
    TranslatePipe,
    IconButtonModule,
    MatDialogClose,
    CardModule,
    TranslateDirective,
    LinkModule,
    ExplainerVideoComponent,
  ],
})
export class UserHelpMenuDialogComponent {
  protected readonly explainerVideos = explainerVideos;
}
