/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GRPC_ERROR_MAPPER, NOT_FOUND_ERROR_URL, PERMISSION_DENIED_ERROR_URL, VotingLibModule } from '@abraxas/voting-lib';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from '@abraxas/base-components';
import { GrpcStatusEvent } from '@ngx-grpc/common';

@NgModule({
  declarations: [],
  imports: [CommonModule, BrowserAnimationsModule, VotingLibModule, TranslateModule, ButtonModule],
  exports: [],
})
export class EcollectingLibModule {
  public static forRoot(): ModuleWithProviders<EcollectingLibModule> {
    return {
      ngModule: EcollectingLibModule,
      providers: [
        {
          provide: GRPC_ERROR_MAPPER,
          useValue: (err: any) => (err instanceof GrpcStatusEvent ? { code: err.statusCode, message: err.statusMessage } : undefined),
        },
        {
          provide: NOT_FOUND_ERROR_URL,
          useValue: '/errors/404',
        },
        {
          provide: PERMISSION_DENIED_ERROR_URL,
          useValue: '/errors/404',
        },
      ],
    };
  }
}
