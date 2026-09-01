/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { CustomDialogService } from './custom-dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly customDialogService = inject(CustomDialogService);

  public async confirm(data: ConfirmDialogData, widthWithUnit?: string): Promise<boolean> {
    const dialogRef = this.customDialogService.openWithoutAutoFocus(ConfirmDialogComponent, data, widthWithUnit);
    return firstValueFrom(dialogRef.afterClosed());
  }
}
