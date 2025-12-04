/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { DateModule } from '@abraxas/base-components';
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
import { DecreeEditDialogData } from '../../admin/decrees/decree-edit-dialog/decree-edit-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent, ToastService, tomorrowAtStartOfDay } from 'ecollecting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { InitiativeService } from '../../core/services/initiative.service';
import { DecreeService } from '../../core/services/decree.service';
import { Decree } from '../../core/models/decree.model';
import { Initiative } from '../../core/models/initiative.model';

@Component({
  selector: 'app-control-sign-sensitive-data-expiry-dialog',
  imports: [DateModule, DialogComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './control-sign-sensitive-data-expiry-dialog.component.html',
})
export class ControlSignSensitiveDataExpiryDialogComponent {
  private readonly initiativeService = inject(InitiativeService);
  private readonly decreeService = inject(DecreeService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialogData = inject<ControlSignSensitiveDataExpiryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<DecreeEditDialogData, boolean>>(MatDialogRef);

  protected readonly tomorrow: Date;
  protected readonly form: FormGroup<Form>;
  protected saving: boolean = false;

  constructor() {
    this.tomorrow = tomorrowAtStartOfDay();
    this.form = this.buildForm();
  }

  protected async save(): Promise<void> {
    if (!this.form.valid) {
      return;
    }

    this.saving = true;
    try {
      const expiryDate = new Date(this.form.value.sensitiveDataExpiryDate!);

      if (this.dialogData.decree) {
        await this.decreeService.setSensitiveDataExpiryDate(this.dialogData.decree.id, expiryDate);
        this.dialogData.decree.sensitiveDataExpiryDate = expiryDate;
      } else if (this.dialogData.initiative) {
        await this.initiativeService.setSensitiveDataExpiryDate(this.dialogData.initiative.id, expiryDate);
        this.dialogData.initiative.sensitiveDataExpiryDate = expiryDate;
      }

      this.toast.success('CONTROL_SIGNS.SENSITIVE_DATA_EXPIRY_DATE.SAVED');
      this.dialogRef.close(true);
    } finally {
      this.saving = false;
    }
  }

  protected close(): void {
    this.dialogRef.close(false);
  }

  private buildForm(): FormGroup<Form> {
    let date = this.dialogData.decree?.sensitiveDataExpiryDate ?? this.dialogData.initiative?.sensitiveDataExpiryDate ?? new Date();
    if (date < this.tomorrow) {
      date = this.tomorrow;
    }

    return this.formBuilder.group<Form>({
      sensitiveDataExpiryDate: this.formBuilder.control(date, {
        validators: [
          Validators.required,
          Validators.minLength(1), // the bc emit empty string for empty date pickers
          this.minTomorrowValidator(),
        ],
      }),
    });
  }

  private minTomorrowValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = new Date(control.value);
      if (isNaN(value.getTime())) return { invalidDate: true };

      return value >= this.tomorrow ? null : { minDate: true };
    };
  }
}

interface Form {
  sensitiveDataExpiryDate: FormControl<Date | string | undefined>; // the bc date picker emit strings...
}

export interface ControlSignSensitiveDataExpiryDialogData {
  decree?: Decree;
  initiative?: Initiative;
}
