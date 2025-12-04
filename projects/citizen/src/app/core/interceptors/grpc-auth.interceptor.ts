/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { GrpcEvent, GrpcMessage, GrpcRequest } from '@ngx-grpc/common';
import { GrpcHandler, GrpcInterceptor } from '@ngx-grpc/core';
import { Observable } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';

const authorizationKey = 'Authorization';
const bearerPrefix = 'Bearer ';

@Injectable({
  providedIn: 'root',
})
export class GrpcAuthInterceptor implements GrpcInterceptor {
  private readonly authService = inject(OAuthService);

  public intercept<Q extends GrpcMessage, S extends GrpcMessage>(request: GrpcRequest<Q, S>, next: GrpcHandler): Observable<GrpcEvent<S>> {
    const accessToken = this.authService.getAccessToken();

    if (accessToken) {
      request.requestMetadata.set(authorizationKey, bearerPrefix + accessToken);
    }

    return next.handle(request);
  }
}
