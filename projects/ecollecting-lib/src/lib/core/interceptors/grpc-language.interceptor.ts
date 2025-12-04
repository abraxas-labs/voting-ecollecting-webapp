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

const languageKey = 'x-language';

@Injectable({
  providedIn: 'root',
})
export class GrpcLanguageInterceptor implements GrpcInterceptor {
  private readonly languageService = inject(LanguageService);

  public intercept<Q extends GrpcMessage, S extends GrpcMessage>(request: GrpcRequest<Q, S>, next: GrpcHandler): Observable<GrpcEvent<S>> {
    request.requestMetadata.set(languageKey, this.languageService.currentLanguage);
    return next.handle(request);
  }
}
