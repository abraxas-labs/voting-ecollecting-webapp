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
    const title = this.buildTitle(snapshot) ?? 'APP.TITLE';
    this.titleService.setTitle(this.i18n.instant(title));
  }
}
