/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { BaseDialogWithUnsavedChangesCheckComponent, DeepRequired, DialogComponent } from 'ecollecting-lib';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { InitiativeService } from '../../core/services/initiative.service';
import { InitiativeReturnForCorrectionLockedFieldComponent } from './initiative-return-for-correction-locked-field/initiative-return-for-correction-locked-field.component';

@Component({
  selector: 'app-initiative-return-for-correction-dialog',
  templateUrl: './initiative-return-for-correction-dialog.component.html',
  imports: [DialogComponent, TranslatePipe, ReactiveFormsModule, InitiativeReturnForCorrectionLockedFieldComponent],
})
export class InitiativeReturnForCorrectionDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<InitiativeReturnForCorrectionDialogComponent> {
  protected readonly data = inject<InitiativeReturnForCorrectionDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly initiativeService = inject(InitiativeService);

  protected form!: FormGroup<Form>;
  protected saving: boolean = false;

  constructor() {
    super();

    this.buildForm();
  }

  public async returnForCorrection(): Promise<void> {
    const values = this.form.value as DeepRequired<typeof this.form.value>;
    try {
      this.saving = true;
      await this.initiativeService.returnForCorrection(this.data.collectionId, values.lockedFields);
      this.dialogRef.close(true);
    } finally {
      this.saving = false;
    }
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  protected updateLockedField(field: keyof FormLockedFields, value: boolean): void {
    this.form.patchValue({
      lockedFields: {
        [field]: value,
      },
    });
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      lockedFields: this.formBuilder.group({
        wording: this.formBuilder.control(true),
        description: this.formBuilder.control(true),
        committeeMembers: this.formBuilder.control(true),
      }),
    });
  }
}

export interface InitiativeReturnForCorrectionDialogData {
  collectionId: string;
}

export interface Form {
  lockedFields: FormGroup<FormLockedFields>;
}

export interface FormLockedFields {
  wording: FormControl<boolean>;
  description: FormControl<boolean>;
  committeeMembers: FormControl<boolean>;
}
