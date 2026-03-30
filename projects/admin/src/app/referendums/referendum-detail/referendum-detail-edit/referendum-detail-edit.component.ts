/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input, OnChanges } from '@angular/core';
import { TextModule, TextareaModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { Referendum } from '../../../core/models/referendum.model';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import { CollectionAddress } from 'ecollecting-lib';

@Component({
  selector: 'app-referendum-detail-edit',
  imports: [TextModule, TextareaModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './referendum-detail-edit.component.html',
  styleUrl: './referendum-detail-edit.component.scss',
})
export class ReferendumDetailEditComponent implements OnChanges {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  @Input({ required: true })
  public referendum!: Referendum;

  protected readonly form: FormGroup<Form>;
  public showValidationErrors = false;

  constructor() {
    this.form = this.buildForm();
  }

  public ngOnChanges(): void {
    this.form.patchValue({
      description: this.referendum.collection.description,
      reason: this.referendum.collection.reason,
      address: this.referendum.collection.address,
      membersCommittee: this.referendum.membersCommittee,
      link: this.referendum.collection.link,
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
      reason: values.reason,
      address: values.address as CollectionAddress,
      membersCommittee: values.membersCommittee,
      link: values.link,
    };
  }

  private buildForm(): FormGroup<Form> {
    return this.formBuilder.group<Form>({
      description: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [AsyncInputValidators.complexSlText],
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
      membersCommittee: this.formBuilder.control('', {
        validators: [Validators.maxLength(2_000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
      link: this.formBuilder.control('', {
        validators: [Validators.maxLength(2_000), InputValidators.httpsUrl],
      }),
    });
  }
}

export interface Form {
  description: FormControl<string>;
  reason: FormControl<string>;
  address: FormGroup<FormAddress>;
  membersCommittee: FormControl<string>;
  link: FormControl<string>;
}

export interface FormAddress {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}

export interface FormValues {
  description: string;
  reason: string;
  address: CollectionAddress;
  membersCommittee: string;
  link: string;
}
