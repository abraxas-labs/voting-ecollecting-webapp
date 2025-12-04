/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent, isGrpcError, ValidationMessagesProvider } from 'ecollecting-lib';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AlertBarModule,
  DropdownModule,
  ErrorModule,
  LabelModule,
  RadioButtonModule,
  ReadonlyModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { ReferendumService } from '../../../core/services/referendum.service';
import { insufficientAcrException } from '../../../core/exceptions';

const referendumNotFoundException = 'ReferendumNotFoundException';
const referendumAlreadyInPreparationException = 'ReferendumAlreadyInPreparationException';

@Component({
  selector: 'app-seek-referendum-dialog',
  templateUrl: './seek-referendum-dialog.component.html',
  styleUrls: ['./seek-referendum-dialog.component.scss'],
  imports: [
    DialogComponent,
    DropdownModule,
    TranslatePipe,
    ReactiveFormsModule,
    ReadonlyModule,
    TextModule,
    RadioButtonModule,
    LabelModule,
    ErrorModule,
    KeyValuePipe,
    NgTemplateOutlet,
    AlertBarModule,
  ],
})
export class SeekReferendumDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  SeekReferendumDialogData,
  SeekReferendumDialogResult
> {
  public readonly validationMessagesProvider = inject(ValidationMessagesProvider);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly referendumService = inject(ReferendumService);
  private readonly translate = inject(TranslateService);

  public saving: boolean = false;
  public form!: FormGroup<Form>;

  public isPaperSubmission: boolean = false;
  public isElectronicSubmission: boolean = false;
  public decreeId?: string;
  public error?: string;

  constructor() {
    super();
    const dialogData = inject<SeekReferendumDialogData>(MAT_DIALOG_DATA);
    this.decreeId = dialogData.decreeId;
    this.buildForm();

    if (!this.decreeId) {
      this.form.controls.description.enable();
      this.form.controls.description.setValidators([Validators.required, Validators.maxLength(200)]);
      this.form.controls.description.updateValueAndValidity();
    }
  }

  public async save(): Promise<void> {
    const values = this.form.value as Required<typeof this.form.value>;
    try {
      this.saving = true;

      const id = this.isPaperSubmission
        ? await this.referendumService.setInPreparation(values.number)
        : await this.referendumService.create(values.description, this.decreeId);

      this.dialogRef.close({ id });
    } catch (e) {
      if (isGrpcError(e, referendumNotFoundException)) {
        this.setErrorOnNumberField(referendumNotFoundException);
      } else if (isGrpcError(e, referendumAlreadyInPreparationException)) {
        this.setErrorOnNumberField(referendumAlreadyInPreparationException);
      } else if (isGrpcError(e, insufficientAcrException)) {
        this.error = insufficientAcrException;
      } else {
        throw e;
      }
    } finally {
      this.saving = false;
    }
  }

  public updatePaperSubmissionValidators(): void {
    if (this.isPaperSubmission) {
      this.form.controls.number.enable();
      this.form.controls.number.setValidators([Validators.required, Validators.maxLength(50)]);
    } else {
      this.form.controls.number.disable();
      this.form.controls.number.clearValidators();
    }
    this.form.controls.number.updateValueAndValidity();
  }

  public updateElectronicSubmissionValidators(): void {
    if (this.isElectronicSubmission) {
      this.form.controls.description.enable();
      this.form.controls.description.setValidators([Validators.required, Validators.maxLength(200)]);
    } else {
      this.form.controls.description.disable();
      this.form.controls.description.clearValidators();
    }
    this.form.controls.description.updateValueAndValidity();
  }

  protected override get hasChanges(): boolean {
    return this.form.valid;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      description: this.formBuilder.control(
        { value: '', disabled: true },
        {
          asyncValidators: [AsyncInputValidators.complexSlText],
        },
      ),
      number: this.formBuilder.control(
        { value: '', disabled: true },
        {
          asyncValidators: [AsyncInputValidators.simpleSlText],
        },
      ),
    });
  }

  private setErrorOnNumberField(errorType: string): void {
    const key = `ERROR_MESSAGES.${errorType}`;
    const message = this.translate.instant(key);
    const errors: any = {};
    errors[errorType] = message;
    this.form.controls.number.setErrors(errors);
  }
}

export interface SeekReferendumDialogData {
  decreeId?: string;
}

export interface SeekReferendumDialogResult {
  id: string;
}

export interface Form {
  description: FormControl<string>;
  number: FormControl<string>;
}
