/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent, ToastService } from 'ecollecting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { ButtonModule, LabelModule, ReadonlyModule, TextModule } from '@abraxas/base-components';
import { InitiativeCommitteeMember } from '../../../../core/models/initiative.model';
import { InitiativeService } from '../../../../core/services/initiative.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-initiative-detail-committee-members-edit-dialog',
  imports: [DialogComponent, TranslatePipe, TextModule, ReactiveFormsModule, ButtonModule, ReadonlyModule, DatePipe, LabelModule],
  templateUrl: './initiative-detail-committee-members-edit-dialog.component.html',
  styleUrl: './initiative-detail-committee-members-edit-dialog.component.scss',
})
export class InitiativeDetailCommitteeMembersEditDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<InitiativeDetailCommitteeMembersEditDialogData> {
  protected readonly dialogData = inject<InitiativeDetailCommitteeMembersEditDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly initiativeService = inject(InitiativeService);
  private readonly toast = inject(ToastService);

  protected saving = false;
  protected form: FormGroup<EditForm>;

  constructor() {
    super();

    this.form = this.formBuilder.group<EditForm>({
      politicalFirstName: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      politicalLastName: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      politicalResidence: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      politicalDuty: this.formBuilder.control('', {
        validators: [Validators.maxLength(50)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
    });

    this.form.patchValue({
      politicalFirstName: this.dialogData.member.politicalFirstName,
      politicalLastName: this.dialogData.member.politicalLastName,
      politicalResidence: this.dialogData.member.politicalResidence,
      politicalDuty: this.dialogData.member.politicalDuty,
    });
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  public async save(): Promise<void> {
    this.saving = true;

    try {
      const values = this.form.value as Required<typeof this.form.value>;

      await this.initiativeService.updateCommitteeMember({
        initiativeId: this.dialogData.initiativeId,
        id: this.dialogData.member.id,
        ...values,
      });

      Object.assign(this.dialogData.member, values);
      this.toast.success('INITIATIVE.COMMITTEE.MEMBERS.EDIT_DIALOG.SAVED');
      this.dialogRef.close();
    } finally {
      this.saving = false;
    }
  }
}

export interface InitiativeDetailCommitteeMembersEditDialogData {
  initiativeId: string;
  member: InitiativeCommitteeMember;
}

interface EditForm {
  politicalFirstName: FormControl<string>;
  politicalLastName: FormControl<string>;
  politicalResidence: FormControl<string>;
  politicalDuty: FormControl<string>;
}
