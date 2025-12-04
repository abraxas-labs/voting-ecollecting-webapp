/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileInputModule, IconButtonModule, LabelModule } from '@abraxas/base-components';
import { MatHint } from '@angular/material/form-field';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'vo-ecol-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  imports: [FileInputModule, LabelModule, MatHint, IconButtonModule, FileUploadComponent, TranslatePipe],
})
export class ImageUploadComponent {
  @Input()
  public imageSrc?: SafeResourceUrl | null;

  @Input()
  public label: string = '';

  @Input()
  public hint: string = '';

  @Input()
  public error: boolean = false;

  @Input()
  public filename?: string;

  @Input()
  public fileLoading: boolean = false;

  @Input()
  public canUpload: boolean = true;

  @Input()
  public canDelete: boolean = true;

  @Input()
  public required: boolean = false;

  @Output()
  public imageChanged: EventEmitter<File> = new EventEmitter<File>();

  @Output()
  public imageDeleted: EventEmitter<void> = new EventEmitter<void>();

  protected readonly acceptedFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];

  protected maxSizeInBytes: number = 3 * 1024 * 1024; // 3 MB
}
