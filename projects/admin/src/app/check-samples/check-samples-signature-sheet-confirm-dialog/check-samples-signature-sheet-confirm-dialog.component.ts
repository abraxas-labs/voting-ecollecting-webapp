/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { DialogComponent } from 'ecollecting-lib';
import { VotingLibModule } from '@abraxas/voting-lib';
import { ButtonModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';

@Component({
  selector: 'app-check-samples-signature-sheet-confirm-dialog',
  templateUrl: './check-samples-signature-sheet-confirm-dialog.component.html',
  imports: [DialogComponent, VotingLibModule, ButtonModule, TranslatePipe],
})
export class CheckSamplesSignatureSheetConfirmDialogComponent {
  protected dialogData = inject<CheckSamplesSignatureSheetConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<CheckSamplesSignatureSheetConfirmDialogComponent, CheckSamplesSignatureSheetConfirmDialogResult>>(MatDialogRef);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);

  protected savingAndClose = false;
  protected savingAndNextList = false;

  protected async saveAndClose(): Promise<void> {
    try {
      this.savingAndClose = true;
      await this.save();
      this.dialogRef.close({
        totalValidDifference: this.dialogData.addedPersonRegisterIds.length - this.dialogData.removedPersonRegisterIds.length,
      } as CheckSamplesSignatureSheetConfirmDialogResult);
    } finally {
      this.savingAndClose = false;
    }
  }

  protected async saveAndNextList(): Promise<void> {
    try {
      this.savingAndNextList = true;
      const nextSignatureSheetId = await this.save();
      this.dialogRef.close({
        totalValidDifference: this.dialogData.addedPersonRegisterIds.length - this.dialogData.removedPersonRegisterIds.length,
        nextSignatureSheetId,
      } as CheckSamplesSignatureSheetConfirmDialogResult);
    } finally {
      this.savingAndNextList = false;
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private async save(): Promise<string> {
    const response = await this.collectionSignatureSheetService.confirm({
      collectionId: this.dialogData.collectionId,
      signatureSheetId: this.dialogData.signatureSheetId,
      collectionType: this.dialogData.collectionType,
      addedPersonRegisterIds: this.dialogData.addedPersonRegisterIds,
      removedPersonRegisterIds: this.dialogData.removedPersonRegisterIds,
      signatureCountTotal: this.dialogData.signatureCountTotal,
    });
    return response.nextSignatureSheetId;
  }
}

export interface CheckSamplesSignatureSheetConfirmDialogData {
  collectionId: string;
  signatureSheetId: string;
  collectionType: CollectionType;
  addedPersonRegisterIds: string[];
  removedPersonRegisterIds: string[];
  signatureCountTotal: number;
}

export interface CheckSamplesSignatureSheetConfirmDialogResult {
  totalValidDifference: number;
  nextSignatureSheetId: string | undefined;
}
