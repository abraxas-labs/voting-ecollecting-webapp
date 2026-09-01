/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable, TemplateRef } from '@angular/core';
import { DialogService as BcDialogService } from '@abraxas/base-components';
import { MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root',
})
export class CustomDialogService {
  private readonly bcDialogService = inject(BcDialogService);

  public openWithoutAutoFocus<T, D = any, R = any>(
    template: ComponentType<T> | TemplateRef<T>,
    dialogData: D,
    widthWithUnit?: string,
  ): MatDialogRef<T, R> {
    let myConfig = { data: dialogData, autoFocus: false } as MatDialogConfig<D>;
    myConfig = !widthWithUnit ? myConfig : { ...myConfig, width: widthWithUnit };
    return this.bcDialogService.openCustom(template, myConfig);
  }
}
