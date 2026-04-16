/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileInputComponent } from '../file-input/file-input.component';

@Component({
  selector: 'vo-ecol-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  imports: [FileInputComponent],
})
export class ImageUploadComponent {
  @Input()
  public image?: File;

  @Input()
  public label: string = '';

  @Input()
  public hint: string = '';

  @Input()
  public readonly: boolean = false;

  @Input()
  public required: boolean = false;

  @Input()
  public error: boolean = false;

  @Input()
  public fileLoading: boolean = false;

  @Output()
  public imageChanged: EventEmitter<File> = new EventEmitter<File>();

  @Output()
  public imageDeleted: EventEmitter<void> = new EventEmitter<void>();

  protected readonly acceptedFileTypes = 'image/png,image/jpeg,image/jpg';

  protected maxSizeInBytes: number = 3 * 1024 * 1024; // 3 MB
}
