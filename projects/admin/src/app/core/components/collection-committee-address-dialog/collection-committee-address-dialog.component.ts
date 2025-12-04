/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { TextModule } from '@abraxas/base-components';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseDialogWithUnsavedChangesCheckComponent, CollectionAddress, DialogComponent, ToastService } from 'ecollecting-lib';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-collection-committee-address-dialog',
  imports: [DialogComponent, TextModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './collection-committee-address-dialog.component.html',
  styleUrl: './collection-committee-address-dialog.component.scss',
})
export class CollectionCommitteeAddressDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  CollectionCommitteeAddressDialogComponent,
  CollectionCommitteeAddressDialogResult
> {
  private readonly dialogData = inject<CollectionCommitteeAddressDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);
  private readonly collectionService = inject(CollectionService);

  protected form!: FormGroup<Form>;
  protected saving: boolean = false;

  constructor() {
    super();
    this.buildForm();
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  public override closeWithUnsavedChangesCheck(): Promise<void> {
    // do not allow to close the dialog without saving
    return Promise.resolve();
  }

  protected async save(): Promise<void> {
    try {
      this.saving = true;

      const address = this.form.value as CollectionAddress;
      await this.collectionService.setCommitteeAddress(this.dialogData.collectionId, address);
      this.toast.saved();
      this.dialogRef.close({ address });
    } finally {
      this.saving = false;
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      committeeOrPerson: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      streetOrPostOfficeBox: this.formBuilder.control('', {
        validators: [Validators.maxLength(150)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      zipCode: this.formBuilder.control('', {
        validators: [Validators.maxLength(15)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      locality: this.formBuilder.control('', {
        validators: [Validators.maxLength(150)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
    });
  }
}

export interface CollectionCommitteeAddressDialogData {
  collectionId: string;
}

export interface CollectionCommitteeAddressDialogResult {
  address: CollectionAddress;
}

export interface Form {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}
