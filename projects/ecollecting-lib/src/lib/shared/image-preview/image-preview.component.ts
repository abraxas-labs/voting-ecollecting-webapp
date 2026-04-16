/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { IconButtonModule, LabelModule, ReadonlyModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'vo-ecol-image-preview',
  templateUrl: './image-preview.component.html',
  styleUrl: './image-preview.component.scss',
  imports: [LabelModule, ReadonlyModule, TranslatePipe, IconButtonModule],
})
export class ImagePreviewComponent {
  @Input()
  public imageSrc?: SafeResourceUrl | null;

  @Input({ required: true })
  public label!: string;

  @Input()
  public canDelete = true;

  @Output()
  public imageDeleted: EventEmitter<void> = new EventEmitter<void>();
}
