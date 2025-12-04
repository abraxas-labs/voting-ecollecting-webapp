/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DialogComponent } from '../dialog/dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ButtonComponent } from '@abraxas/base-components';

@Component({
  templateUrl: './confirm-dialog.component.html',
  imports: [TranslateModule, DialogComponent],
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<void>>(MatDialogRef);

  public readonly title: string;
  public readonly message: string;
  public readonly confirmText: string;
  public readonly discardText: string;
  public readonly confirmColor: ButtonComponent['color'];

  constructor() {
    const dialogData = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

    this.title = dialogData.title;
    this.message = dialogData.message;
    this.confirmText = dialogData.confirmText;
    this.discardText = dialogData.discardText;
    this.confirmColor = dialogData.confirmColor ?? 'primary';
  }

  public ok(): void {
    this.dialogRef.close(true);
  }

  public close(): void {
    this.dialogRef.close(false);
  }
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  discardText: string;
  confirmColor?: ButtonComponent['color'];
}
