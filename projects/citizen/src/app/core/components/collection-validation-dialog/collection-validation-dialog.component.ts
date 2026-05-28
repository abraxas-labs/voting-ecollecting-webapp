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
import { Validation } from '@abraxas/voting-ecollecting-proto';

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

  private readonly validationOrder: Record<Validation, number> = {
    [Validation.VALIDATION_GENERAL_INFORMATION_NOT_NULL]: 1,
    [Validation.VALIDATION_COMMITTEE_LIST_UPLOADED]: 2,
    [Validation.VALIDATION_APPROVED_COMMITTEE_MEMBERS_MIN_VALID]: 3,
    [Validation.VALIDATION_APPROVED_COMMITTEE_MEMBERS_MAX_VALID]: 4,
    [Validation.VALIDATION_DECREE_NOT_NULL]: 5,
    [Validation.VALIDATION_HAS_DEPUTY_PERMISSIONS]: 6,
    [Validation.VALIDATION_UNSPECIFIED]: 7,
  };

  constructor() {
    const dialogData = inject<CollectionValidationDialogData>(MAT_DIALOG_DATA);

    this.title = dialogData.title;
    this.info = dialogData.info;
    this.validationSummary = dialogData.validationSummary;

    this.validationSummary.validationResults.sort((a, b) => this.validationOrder[a.validation] - this.validationOrder[b.validation]);
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
