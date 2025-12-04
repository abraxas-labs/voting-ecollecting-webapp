/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import {
  DateModule,
  DropdownModule,
  ErrorModule,
  IconModule,
  NumberModule,
  ReadonlyModule,
  TextareaModule,
  TextModule,
} from '@abraxas/base-components';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent, getDate } from 'ecollecting-lib';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-initiative-collection-period-dialog',
  templateUrl: './initiative-collection-period-dialog.component.html',
  imports: [
    DateModule,
    DialogComponent,
    DropdownModule,
    ErrorModule,
    IconModule,
    NumberModule,
    TextModule,
    TextareaModule,
    TranslatePipe,
    ReactiveFormsModule,
    ReadonlyModule,
    DatePipe,
  ],
})
export class InitiativeCollectionPeriodDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  InitiativeCollectionPeriodDialogComponent,
  InitiativeCollectionPeriodDialogResult
> {
  protected readonly data = inject<InitiativeCollectionPeriodDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected form!: FormGroup<Form>;
  protected saving: boolean = false;

  private readonly now: Date;

  constructor() {
    super();
    this.now = new Date();
    this.now.setHours(0, 0, 0, 0);

    this.buildForm();
  }

  public async setCollectionPeriod(): Promise<void> {
    const values = this.form.value as Required<typeof this.form.value>;
    try {
      this.saving = true;
      const collectionStartDate = !this.data.collectionStartDate ? getDate(values.collectionStartDate, 0, 0) : undefined;
      const collectionEndDate = !this.data.collectionEndDate ? getDate(values.collectionEndDate, 23, 59) : undefined;
      this.dialogRef.close({
        collectionStartDate,
        collectionEndDate,
      });
    } finally {
      this.saving = false;
    }
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  private collectionStartDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      let date = getDate(value, 0, 0);
      return date && date < this.now ? { dateNotInFuture: true } : null;
    };
  }

  private collectionEndDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const values = this.form.value as Required<typeof this.form.value>;
      const collectionStartDate = getDate(values.collectionStartDate, 0, 0);

      let date = getDate(value, 0, 0);
      return date && collectionStartDate && date <= collectionStartDate ? { dateNotOlderThanStartDate: true } : null;
    };
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      collectionStartDate: this.formBuilder.control('', {
        validators: [Validators.required, this.collectionStartDateValidator()],
      }),
      collectionEndDate: this.formBuilder.control('', {
        validators: [Validators.required, this.collectionEndDateValidator()],
      }),
    });
  }
}

export interface InitiativeCollectionPeriodDialogData {
  collectionId: string;
  collectionStartDate?: Date;
  collectionEndDate?: Date;
  title: string;
  message: string;
}

export interface InitiativeCollectionPeriodDialogResult {
  collectionStartDate?: Date;
  collectionEndDate?: Date;
}

export interface Form {
  collectionStartDate: FormControl<string | undefined>;
  collectionEndDate: FormControl<string | undefined>;
}
