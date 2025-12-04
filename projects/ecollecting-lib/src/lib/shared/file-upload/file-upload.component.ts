/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { ButtonModule, FileInputModule, IconButtonModule, LabelModule, LinkModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../core/toast.service';
import { FileChipComponent } from '../file-chip/file-chip.component';

@Component({
  selector: 'vo-ecol-file-upload',
  imports: [FileInputModule, LabelModule, TranslatePipe, ButtonModule, IconButtonModule, LinkModule, SpinnerModule, FileChipComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent implements OnInit {
  private readonly toast = inject(ToastService);

  @Input()
  public variant: 'simple-button' | 'dnd-zone' = 'dnd-zone';

  @Input()
  public buttonVariant: 'primary' | 'secondary' | 'tertiary' | 'tertiary-tonal' = 'tertiary';

  @Input()
  public label: string = '';

  @Input()
  public inlineHint: string = '';

  @Input()
  public error: boolean = false;

  @Input()
  public disabled: boolean = false;

  @Input()
  public optional: boolean = false;

  @Input()
  public maxSizeInBytes: number = 10 * 1024 * 1024; // 10 MB

  @Input()
  public filename?: string;

  @Input()
  public canRemoveFile: boolean = true;

  @Input()
  public canOpenFile: boolean = true;

  /**
   * The allowed content types are OR combined with the allowed extensions.
   */
  @Input()
  public allowedContentTypes: string[] = [];

  /**
   * The allowed content types are OR combined with the allowed extensions.
   */
  @Input()
  public allowedExtensions: string[] = [];

  @Input()
  public fileLoading: boolean = false;

  @Output()
  public fileChanged: EventEmitter<File> = new EventEmitter<File>();

  @Output()
  public fileRemoved: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public openFile: EventEmitter<void> = new EventEmitter<void>();

  protected isDragging: boolean = false;
  protected allowedContentTypesAndExtensionsCommaSeparated: string = '';

  @HostListener('drop', ['$event'])
  public async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;

    if (!e.dataTransfer) {
      return;
    }

    this.setFile(e.dataTransfer.files);
  }

  @HostListener('window:dragover', ['$event'])
  public onDragEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('window:dragleave', ['$event'])
  public onDragLeave(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  public ngOnInit(): void {
    this.allowedContentTypesAndExtensionsCommaSeparated = [...this.allowedContentTypes, ...this.allowedExtensions].join(',');
  }

  public setFile(files: FileList | null): void {
    if (!files || files.length !== 1) {
      return;
    }

    const file = files[0];
    const extension = '.' + (file.name.split('.').pop() ?? '');
    if (!this.allowedContentTypes.includes(file.type) && !this.allowedExtensions.includes(extension)) {
      console.error(
        'File type not allowed, received file type: ',
        file.type,
        ', extension: ',
        extension,
        ', allowed types: ',
        this.allowedContentTypes,
        ' allowed extensions: ',
        this.allowedExtensions,
      );
      this.toast.error('FILE_UPLOAD.DATA_TYPE_NOT_ALLOWED_TITLE', 'FILE_UPLOAD.DATA_TYPE_NOT_ALLOWED_MESSAGE');
      return;
    }

    if (file.size > this.maxSizeInBytes) {
      this.toast.error('FILE_UPLOAD.FILE_TOO_LARGE_TITLE', 'FILE_UPLOAD.FILE_TOO_LARGE_MESSAGE');
      return;
    }

    this.fileChanged.emit(file);
  }
}
