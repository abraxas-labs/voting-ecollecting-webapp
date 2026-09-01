/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input, OnChanges } from '@angular/core';
import { TextModule, TextareaModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { Initiative } from '../../../core/models/initiative.model';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncInputValidators, MarkdownEditorComponent } from '@abraxas/voting-lib';
import { CollectionAddress } from 'ecollecting-lib';

@Component({
  selector: 'app-initiative-detail-edit',
  imports: [TextModule, TextareaModule, TranslatePipe, ReactiveFormsModule, MarkdownEditorComponent],
  templateUrl: './initiative-detail-edit.component.html',
  styleUrl: './initiative-detail-edit.component.scss',
})
export class InitiativeDetailEditComponent implements OnChanges {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  @Input({ required: true })
  public initiative!: Initiative;

  protected readonly form: FormGroup<Form>;
  private showValidationErrorsValue = false;

  constructor() {
    this.form = this.buildForm();
  }

  public get showValidationErrors(): boolean {
    return this.showValidationErrorsValue;
  }

  public set showValidationErrors(value: boolean) {
    this.showValidationErrorsValue = value;

    if (value) {
      this.form.markAllAsTouched();
    }
  }

  public ngOnChanges(): void {
    this.form.patchValue({
      description: this.initiative.collection.description,
      wording: this.initiative.wording.markdown,
      reason: this.initiative.collection.reason,
      address: this.initiative.collection.address,
    });
  }

  public getFormValues(): FormValues | undefined {
    if (!this.form.valid) {
      this.showValidationErrors = true;
      return undefined;
    }

    const values = this.form.value as Required<typeof this.form.value>;
    return {
      description: values.description,
      wording: values.wording.trim(),
      reason: values.reason,
      address: values.address as CollectionAddress,
    };
  }

  private buildForm(): FormGroup<Form> {
    return this.formBuilder.group<Form>({
      description: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      wording: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(10_000)],
        asyncValidators: [AsyncInputValidators.markdownText],
      }),
      reason: this.formBuilder.control('', {
        validators: [Validators.maxLength(10_000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
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

export interface Form {
  description: FormControl<string>;
  wording: FormControl<string>;
  reason: FormControl<string>;
  address: FormGroup<FormAddress>;
}

export interface FormAddress {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}

export interface FormValues {
  description: string;
  wording: string;
  reason: string;
  address: CollectionAddress;
}
