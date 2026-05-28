/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileInputModule, FileWithProgress, SnackbarModule } from '@abraxas/base-components';

@Component({
  selector: 'vo-ecol-file-input',
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.scss',
  imports: [FileInputModule, SnackbarModule],
})
export class FileInputComponent {
  @Input()
  public label: string = '';

  @Input({ required: true })
  public accept!: string;

  @Input({ required: true })
  public maxFileSize!: number;

  @Input()
  public dragDropEnabled = false;

  @Input()
  public fileDisplayType: 'status-label' | 'card' | 'preview' = 'status-label';

  @Input()
  public layout: 'button' | 'area' = 'button';

  @Input()
  public hint: string = '';

  @Input()
  public readonly = false;

  @Input()
  public multiple = false;

  @Input()
  public required = false;

  @Input()
  public set error(error: boolean) {
    this.errorValue = error;

    if (this.value) {
      for (const file of this.value) {
        file.error = error;
      }
    }
  }

  @Input()
  public set fileLoading(fileLoading: boolean) {
    this.fileLoadingValue = fileLoading;
    if (this.value) {
      for (const file of this.value) {
        file.isUploading = fileLoading;
      }
    }
  }

  @Input()
  public set files(files: File[]) {
    this.value = files.map(file => ({ file, error: this.errorValue, isUploading: this.fileLoadingValue, progress: 0, link: file.name }));
  }

  @Output()
  public fileClicked: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public fileDeleted: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public filesChanged: EventEmitter<File[]> = new EventEmitter<File[]>();

  protected value?: FileWithProgress[];
  protected errorValue: boolean = false;
  protected fileLoadingValue: boolean = false;

  protected onFilesChange(files: FileWithProgress[] | undefined): void {
    if ((!files || files.length === 0) && this.value) {
      this.fileDeleted.emit();
      delete this.value;
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    this.filesChanged.emit(files.map(file => file.file));
    this.value = files.map(x => ({ ...x, error: this.errorValue, isUploading: this.fileLoadingValue, link: x.file.name }));
  }
}
