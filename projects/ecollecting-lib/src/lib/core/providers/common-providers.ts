/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DatePipe, DecimalPipe } from '@angular/common';
import { Provider } from '@angular/core';
import { ValidationMessagesProvider } from '../validation-messages-provider';
import { ValidationMessagesIntl } from '@abraxas/base-components';

export function getCommonProviders(): Provider[] {
  // common providers for AppModule
  // pipes are required to pre-format data for translations.
  return [
    DecimalPipe,
    DatePipe,
    {
      provide: ValidationMessagesIntl,
      useClass: ValidationMessagesProvider,
    },
  ];
}
