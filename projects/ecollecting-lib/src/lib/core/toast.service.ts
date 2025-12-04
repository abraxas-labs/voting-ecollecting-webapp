/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@abraxas/voting-lib';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(SnackbarService);
  private readonly i18n = inject(TranslateService);

  public success(message: string): void {
    this.snackBar.success(this.i18n.instant(message));
  }

  public saved(): void {
    this.snackBar.success(this.i18n.instant('APP.SAVED'));
  }

  public deleted(): void {
    this.snackBar.success(this.i18n.instant('APP.DELETED'));
  }

  public error(title: string, message: string): void {
    title = !!title ? this.i18n.instant(title) : title;
    message = !!message ? this.i18n.instant(message) : message;
    this.snackBar.error(`${title}: ${message}`);
  }
}
