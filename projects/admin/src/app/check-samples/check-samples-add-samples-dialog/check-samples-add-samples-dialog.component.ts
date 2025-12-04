/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent } from 'ecollecting-lib';
import { CollectionSignatureSheet } from '../../core/models/collection.model';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NumberModule } from '@abraxas/base-components';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-check-samples-add-samples-dialog',
  templateUrl: './check-samples-add-samples-dialog.component.html',
  imports: [DialogComponent, ReactiveFormsModule, NumberModule, TranslatePipe],
})
export class CheckSamplesAddSamplesDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  CheckSamplesAddSamplesDialogComponent,
  CheckSamplesAddSamplesDialogResult
> {
  protected readonly data = inject<CheckSamplesAddSamplesDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);

  protected form!: FormGroup<Form>;
  protected saving: boolean = false;

  constructor() {
    super();
    this.buildForm();
  }

  public async save(): Promise<void> {
    const values = this.form.value as Required<typeof this.form.value>;
    try {
      this.saving = true;
      const sheets = await this.collectionSignatureSheetService.addSamples(this.data.collectionId, values.signatureSheetsCount);
      this.dialogRef.close({ sheets });
    } finally {
      this.saving = false;
    }
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      signatureSheetsCount: this.formBuilder.control(null!, {
        validators: [Validators.required, Validators.min(1)],
      }),
    });
  }
}

export interface CheckSamplesAddSamplesDialogData {
  collectionId: string;
}

export interface CheckSamplesAddSamplesDialogResult {
  sheets: CollectionSignatureSheet[];
}

export interface Form {
  signatureSheetsCount: FormControl<number>;
}
