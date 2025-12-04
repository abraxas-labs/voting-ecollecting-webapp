/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { EnumItemDescription } from '@abraxas/voting-lib';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class EnumItemDescriptionUtils {
  private readonly i18n = inject(TranslateService);

  public getArrayWithDescriptions<T>(enumObj: object | undefined, i18nPrefix: string): EnumItemDescription<T>[] {
    const items = this.getArrayWithDescriptionsWithUnspecified<T>(enumObj, i18nPrefix);
    return items.filter(i => (i.value as any) !== 0);
  }

  public getArrayWithDescriptionsWithUnspecified<T>(enumObj: object | undefined, i18nPrefix: string): EnumItemDescription<T>[] {
    if (!enumObj) {
      return [];
    }

    return Object.values(enumObj)
      .filter(value => typeof value === 'number')
      .map(value => ({
        value: value as T,
        description: this.i18n.instant(i18nPrefix + value),
      }));
  }
}
