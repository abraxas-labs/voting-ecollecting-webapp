/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Directive, HostListener, OnDestroy, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom, Subscription } from 'rxjs';
import { DialogService } from '@abraxas/base-components';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

@Directive()
export abstract class BaseDialogWithUnsavedChangesCheckComponent<T, R = any> implements OnDestroy {
  protected dialogRef = inject<MatDialogRef<T, R>>(MatDialogRef);
  protected dialogService = inject(DialogService);

  private backdropClickSubscription: Subscription;

  protected constructor() {
    this.dialogRef.disableClose = true;
    this.backdropClickSubscription = this.dialogRef.backdropClick().subscribe(() => this.closeWithUnsavedChangesCheck());
  }

  public ngOnDestroy(): void {
    this.backdropClickSubscription.unsubscribe();
  }

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  @HostListener('window:keyup.esc')
  public async keyUpEscape(): Promise<void> {
    await this.closeWithUnsavedChangesCheck();
  }

  public async closeWithUnsavedChangesCheck(): Promise<void> {
    if (await this.leaveDialogOpen()) {
      return;
    }

    this.dialogRef.close();
  }

  protected abstract get hasChanges(): boolean;

  private async leaveDialogOpen(): Promise<boolean> {
    if (!this.hasChanges) {
      return false;
    }

    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'APP.CHANGES.TITLE',
      message: 'APP.CHANGES.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !result;
  }
}
