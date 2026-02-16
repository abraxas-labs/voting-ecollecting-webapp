/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { inject } from '@angular/core';
import { OAuthStorage } from 'angular-oauth2-oidc';
import { isUrlWithinBase } from 'ecollecting-lib';

const authorizationKey = 'Authorization';
const bearerPrefix = 'Bearer ';
const accessTokenStorageField = 'access_token';

export function httpAuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (!isUrlWithinBase(req.url, environment.restApiEndpoint) || !!req.headers.get(authorizationKey)) {
    return next(req);
  }

  const accessToken = inject(OAuthStorage).getItem(accessTokenStorageField);
  if (!accessToken) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { [authorizationKey]: `${bearerPrefix}${accessToken}` },
    }),
  );
}
