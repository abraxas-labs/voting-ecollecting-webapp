/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { DialogService } from '@abraxas/base-components';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly dialogService = inject(DialogService);

  public async confirm(data: ConfirmDialogData, widthWithUnit?: string): Promise<boolean> {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, data, widthWithUnit);
    return firstValueFrom(dialogRef.afterClosed());
  }
}
