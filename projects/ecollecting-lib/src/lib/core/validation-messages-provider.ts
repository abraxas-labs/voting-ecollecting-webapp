/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import { Language } from '@abraxas/base-components';
import { ValidationMessagesProvider as LibValidationMessagesProvider } from '@abraxas/voting-lib';

@Injectable({
  providedIn: 'root',
})
export class ValidationMessagesProvider extends LibValidationMessagesProvider {
  constructor() {
    super();
    this.setTranslation(Language.DE, {
      minlength: 'Die Mindestlänge beträgt {{requiredLength}} Zeichen',
      maxlength: 'Die maximale Länge beträgt {{requiredLength}} Zeichen',
    });
  }
}
