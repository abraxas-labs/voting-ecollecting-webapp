/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { ReadonlyModule, TextModule } from '@abraxas/base-components';
import { BaseDialogWithUnsavedChangesCheckComponent, DeepRequired, DialogComponent } from 'ecollecting-lib';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Decree } from '../../core/models/decree.model';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { ReferendumService } from '../../core/services/referendum.service';

@Component({
  selector: 'app-referendum-new-dialog',
  templateUrl: './referendum-new-dialog.component.html',
  styleUrls: ['./referendum-new-dialog.component.scss'],
  imports: [DialogComponent, TextModule, TranslatePipe, ReactiveFormsModule, ReadonlyModule],
})
export class ReferendumNewDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  ReferendumNewDialogComponent,
  ReferendumNewDialogResult
> {
  protected readonly data = inject<ReferendumNewDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly referendumService = inject(ReferendumService);

  protected form!: FormGroup<Form>;
  protected saving: boolean = false;

  constructor() {
    super();

    this.buildForm();
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  protected async save(): Promise<void> {
    try {
      this.saving = true;
      const values = this.form.value as DeepRequired<typeof this.form.value>;
      const referendumId = await this.referendumService.create(this.data.decree.id, values.description, values.address);
      this.dialogRef.close({ referendumId });
    } finally {
      this.saving = false;
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      description: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      address: this.formBuilder.group({
        committeeOrPerson: this.formBuilder.control('', {
          validators: [Validators.required, Validators.maxLength(100)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        streetOrPostOfficeBox: this.formBuilder.control('', {
          validators: [Validators.required, Validators.maxLength(150)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        zipCode: this.formBuilder.control('', {
          validators: [Validators.required, Validators.maxLength(15)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        locality: this.formBuilder.control('', {
          validators: [Validators.required, Validators.maxLength(150)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
      }),
    });
  }
}

export interface ReferendumNewDialogData {
  decree: Decree;
}

export interface ReferendumNewDialogResult {
  referendumId: string;
}

export interface Form {
  description: FormControl<string>;
  address: FormGroup<FormAddress>;
}

export interface FormAddress {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}
