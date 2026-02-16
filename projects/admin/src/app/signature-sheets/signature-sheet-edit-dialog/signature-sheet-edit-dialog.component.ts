/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, inject, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CheckboxModule, DateModule, NumberModule, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent, ToastService } from 'ecollecting-lib';
import { CollectionSignatureSheet, CollectionSignatureSheetNumberInfo } from '../../core/models/collection.model';
import { DecimalPipe } from '@angular/common';
import { take } from 'rxjs';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';

@Component({
  selector: 'app-signature-sheet-edit-dialog',
  imports: [
    TranslatePipe,
    DialogComponent,
    SpinnerModule,
    ReadonlyModule,
    DecimalPipe,
    DateModule,
    ReactiveFormsModule,
    NumberModule,
    CheckboxModule,
  ],
  templateUrl: './signature-sheet-edit-dialog.component.html',
  styleUrl: './signature-sheet-edit-dialog.component.scss',
})
export class SignatureSheetEditDialogComponent
  extends BaseDialogWithUnsavedChangesCheckComponent<SignatureSheetEditDialogData>
  implements OnInit
{
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialogData = inject<SignatureSheetEditDialogData>(MAT_DIALOG_DATA);

  protected info?: CollectionSignatureSheetNumberInfo;
  protected form!: FormGroup<Form>;
  protected saving = false;

  protected readonly isNew: boolean;
  protected readonly today = new Date();

  constructor() {
    super();
    this.isNew = this.dialogData.sheet === undefined;

    this.buildForm(this.dialogData.sheet?.count?.valid ?? 1);
    if (this.dialogData.sheet === undefined) {
      this.dialogRef
        .beforeClosed()
        .pipe(take(1))
        .subscribe(() => this.tryReleaseNumberAsNeeded());
    } else {
      this.form.patchValue({
        appliedNumberOnPaper: true,
        receivedAt: this.dialogData.sheet.receivedAt,
        signaturesCountTotal: this.dialogData.sheet.count.total,
      });
    }
  }

  protected get hasChanges(): boolean {
    return this.form.dirty || this.isNew;
  }

  protected get formValue(): Required<typeof this.form.value> {
    return this.form.value as Required<typeof this.form.value>;
  }

  public async ngOnInit(): Promise<void> {
    if (this.dialogData.sheet === undefined) {
      this.info = await this.collectionSignatureSheetService.reserveNumber(this.dialogData.collectionId);
    } else {
      this.info = {
        number: this.dialogData.sheet.number,
        bfs: this.dialogData.sheet.bfs,
        municipalityName: this.dialogData.sheet.municipalityName,
      };
    }
  }

  protected async save(): Promise<void> {
    if (!this.form.valid || !this.info) {
      return;
    }

    try {
      this.saving = true;
      const date = new Date(this.formValue.receivedAt);
      let id: string;
      if (this.dialogData.sheet === undefined) {
        id = await this.collectionSignatureSheetService.add(
          this.dialogData.collectionId,
          this.info.number,
          date,
          this.formValue.signaturesCountTotal,
        );
      } else {
        await this.collectionSignatureSheetService.update(
          this.dialogData.collectionId,
          this.dialogData.sheet.id,
          date,
          this.formValue.signaturesCountTotal,
        );
        id = this.dialogData.sheet.id;
        this.dialogData.sheet.receivedAt = date;
        this.dialogData.sheet.count.total = this.formValue.signaturesCountTotal;
        this.dialogData.sheet.count.invalid = this.dialogData.sheet.count.total - this.dialogData.sheet.count.valid;
      }

      this.toast.success('COLLECTION.SIGNATURE_SHEETS.EDIT_DIALOG.SAVED');
      this.dialogRef.close(id);
    } finally {
      this.saving = false;
    }
  }

  @HostListener('window:beforeunload')
  private async tryReleaseNumberAsNeeded(): Promise<void> {
    if (this.info === undefined || !this.isNew || this.formValue.appliedNumberOnPaper) {
      return;
    }

    await this.collectionSignatureSheetService.tryReleaseNumber(this.dialogData.collectionId, this.info.number);
  }

  private buildForm(minSignaturesTotalCount: number): void {
    this.form = this.formBuilder.group<Form>({
      appliedNumberOnPaper: this.formBuilder.control(false, {
        validators: [Validators.required],
      }),
      receivedAt: this.formBuilder.control<Date>(null!, {
        validators: [Validators.required],
      }),
      signaturesCountTotal: this.formBuilder.control<number>(null!, {
        validators: [Validators.required, Validators.min(minSignaturesTotalCount)],
      }),
    });
  }
}

export interface SignatureSheetEditDialogData {
  collectionId: string;
  sheet?: CollectionSignatureSheet;
}

interface Form {
  appliedNumberOnPaper: FormControl<boolean>;
  receivedAt: FormControl<Date>;
  signaturesCountTotal: FormControl<number>;
}
