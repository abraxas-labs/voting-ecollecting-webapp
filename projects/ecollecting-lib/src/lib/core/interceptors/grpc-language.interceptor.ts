/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageService } from '../language.service';
import { GrpcHandler, GrpcInterceptor } from '@ngx-grpc/core';
import { GrpcEvent, GrpcMessage, GrpcRequest } from '@ngx-grpc/common';
import { isUrlWithinBase } from '../utils/url.utils';
import { GRPC_ENV_INJECTION_TOKEN } from '../tokens';

const languageKey = 'x-language';

@Injectable({
  providedIn: 'root',
})
export class GrpcLanguageInterceptor implements GrpcInterceptor {
  private readonly languageService = inject(LanguageService);
  private readonly grpcEnv = inject(GRPC_ENV_INJECTION_TOKEN);

  public intercept<Q extends GrpcMessage, S extends GrpcMessage>(request: GrpcRequest<Q, S>, next: GrpcHandler): Observable<GrpcEvent<S>> {
    const host = request.client.getSettings().host + request.path;
    if (isUrlWithinBase(host, this.grpcEnv.grpcApiEndpoint)) {
      request.requestMetadata.set(languageKey, this.languageService.currentLanguage);
    }

    return next.handle(request);
  }
}
