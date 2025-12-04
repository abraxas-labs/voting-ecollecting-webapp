/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import {
  BaseDialogWithUnsavedChangesCheckComponent,
  CollectionCount,
  DialogComponent,
  EnumItemDescriptionUtils,
  getDate,
} from 'ecollecting-lib';
import { CollectionCameNotAboutReason, CollectionState } from '@abraxas/voting-ecollecting-proto';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  DateModule,
  ErrorModule,
  RadioButton,
  RadioButtonModule,
  StatusToggleModule,
  TableDataSource,
  TableModule,
  TextModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-collection-finish-dialog',
  templateUrl: './collection-finish-dialog.component.html',
  styleUrls: ['./collection-finish-dialog.component.scss'],
  imports: [
    DialogComponent,
    TranslatePipe,
    DecimalPipe,
    StatusToggleModule,
    RadioButtonModule,
    DateModule,
    ErrorModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
    TextModule,
    TableModule,
    TooltipModule,
    TruncateWithTooltipModule,
  ],
})
export class CollectionFinishDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  CollectionFinishDialogComponent,
  CollectionFinishDialogResult
> {
  protected dialogData = inject<CollectionFinishDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly collectionStates = CollectionState;
  protected readonly cameNotAboutReasonChoices: RadioButton[];
  protected readonly now: Date = new Date();

  protected readonly descriptionColumn = 'description';
  protected readonly electronicAttestedColumn = 'electronicAttested';
  protected readonly totalAttestedColumn = 'totalAttested';
  protected readonly columns = [this.descriptionColumn, this.electronicAttestedColumn, this.totalAttestedColumn];

  protected cameAbout: boolean;
  protected cameNotAbout: boolean;

  protected dataSource = new TableDataSource<CollectionCount>();
  protected form!: FormGroup<Form>;

  constructor() {
    super();
    const enumItemDescriptionUtils = inject(EnumItemDescriptionUtils);

    this.cameAbout = this.dialogData.totalCitizenCount >= this.dialogData.minSignatureCount;
    this.cameNotAbout = !this.cameAbout;

    this.cameNotAboutReasonChoices = enumItemDescriptionUtils
      .getArrayWithDescriptions<CollectionCameNotAboutReason>(CollectionCameNotAboutReason, 'COLLECTION.CAME_NOT_ABOUT_REASONS.')
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));

    this.dataSource.data = this.dialogData.collectionCounts;

    this.buildForm();
    this.updateValidators();
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  protected finish(): void {
    const values = this.form.value as Required<typeof this.form.value>;
    this.dialogRef.close({
      cameAbout: this.cameAbout,
      cameNotAboutReason: values.cameNotAboutReason,
      sensitiveDataExpiryDate: getDate(values.sensitiveDataExpiryDate, 0, 0),
    });
  }

  protected updateValidators(): void {
    if (this.cameNotAbout) {
      this.form.controls.cameNotAboutReason.setValidators([Validators.required]);
    } else {
      this.form.controls.cameNotAboutReason.clearValidators();
    }

    this.form.controls.cameNotAboutReason.updateValueAndValidity();
  }

  private buildForm(): void {
    const initialCameNotAboutReason =
      this.dialogData.totalCitizenCount === this.dialogData.electronicCitizenCount
        ? CollectionCameNotAboutReason.COLLECTION_CAME_NOT_ABOUT_REASON_NO_SIGNATURE_SHEET_UPLOADED
        : CollectionCameNotAboutReason.COLLECTION_CAME_NOT_ABOUT_REASON_MIN_SIGNATURE_COUNT_NOT_REACHED;
    this.form = this.formBuilder.group<Form>({
      sensitiveDataExpiryDate: this.formBuilder.control('', [Validators.required]),
      cameNotAboutReason: this.formBuilder.control(this.cameNotAbout ? initialCameNotAboutReason : undefined),
    });
  }
}

export interface CollectionFinishDialogData {
  minSignatureCount: number;
  electronicCitizenCount: number;
  totalCitizenCount: number;
  collectionCounts: CollectionCountWithDescription[];
}

export interface CollectionFinishDialogResult {
  cameAbout: boolean;
  cameNotAboutReason?: CollectionCameNotAboutReason;
  sensitiveDataExpiryDate: Date;
}

export interface CollectionCountWithDescription extends CollectionCount {
  description: string;
}

interface Form {
  sensitiveDataExpiryDate: FormControl<string>;
  cameNotAboutReason: FormControl<CollectionCameNotAboutReason | undefined>;
}
