/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ConfirmDialogService } from 'ecollecting-lib';

export const hasUnsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component: HasUnsavedChanges) => {
  const confirmDialogService = inject(ConfirmDialogService);

  if (!component.hasUnsavedChanges) {
    return true;
  }

  component.showValidationErrors = true;

  return confirmDialogService.confirm({
    title: 'APP.INVALID_FORM_VALUES.TITLE',
    message: 'APP.INVALID_FORM_VALUES.MSG',
    confirmText: 'APP.YES',
    discardText: 'APP.DISCARD',
  });
};

export interface HasUnsavedChanges {
  hasUnsavedChanges: boolean;
  showValidationErrors: boolean;
}
