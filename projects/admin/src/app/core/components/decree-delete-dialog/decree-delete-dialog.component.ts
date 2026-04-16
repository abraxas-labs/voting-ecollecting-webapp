/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent, CollectionCardHeaderComponent } from 'ecollecting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { ReferendumDeleteInfo } from '../../models/decree.model';
import { CardModule, StatusLabelModule } from '@abraxas/base-components';
import { CollectionState } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-decree-delete-dialog',
  imports: [DialogComponent, TranslatePipe, CardModule, CollectionCardHeaderComponent, StatusLabelModule],
  templateUrl: './decree-delete-dialog.component.html',
  styleUrl: './decree-delete-dialog.component.scss',
})
export class DecreeDeleteDialogComponent {
  private readonly dialogData = inject<DecreeDeleteDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<DecreeDeleteDialogComponent, boolean>>(MatDialogRef);

  protected readonly referendumInfos: ReferendumDeleteInfo[] = this.dialogData.referendums;
  protected readonly states = CollectionState;

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected close(): void {
    this.dialogRef.close(false);
  }
}

export interface DecreeDeleteDialogData {
  referendums: ReferendumDeleteInfo[];
}
