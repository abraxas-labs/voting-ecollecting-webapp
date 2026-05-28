/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class TranslatableTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly i18n = inject(TranslateService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const extension = this.i18n.instant('APP.TITLES.EXTENSION');
    const snapshotTitle = this.buildTitle(snapshot);
    if (snapshotTitle) {
      this.titleService.setTitle(`${this.i18n.instant(snapshotTitle)} - ${extension}`);
    } else {
      this.titleService.setTitle(extension);
    }
  }
}
