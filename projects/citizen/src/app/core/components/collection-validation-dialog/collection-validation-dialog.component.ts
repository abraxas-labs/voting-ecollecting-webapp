/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from 'ecollecting-lib';
import { ValidationSummary } from '../../models/validation.model';
import { IconModule } from '@abraxas/base-components';

@Component({
  templateUrl: './collection-validation-dialog.component.html',
  styleUrls: ['./collection-validation-dialog.component.scss'],
  imports: [TranslateModule, DialogComponent, DialogComponent, IconModule],
})
export class CollectionValidationDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<CollectionValidationDialogComponent>>(MatDialogRef);

  public readonly title: string;
  public readonly info: string;
  public readonly validationSummary: ValidationSummary;

  constructor() {
    const dialogData = inject<CollectionValidationDialogData>(MAT_DIALOG_DATA);

    this.title = dialogData.title;
    this.info = dialogData.info;
    this.validationSummary = dialogData.validationSummary;
  }

  public ok(): void {
    this.dialogRef.close(true);
  }

  public close(): void {
    this.dialogRef.close(false);
  }
}

export interface CollectionValidationDialogData {
  title: string;
  info: string;
  validationSummary: ValidationSummary;
}
