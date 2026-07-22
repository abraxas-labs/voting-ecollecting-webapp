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
import { addApiRoutePrefix } from '../utils/api-route.utils';

const authorizationKey = 'Authorization';
const bearerPrefix = 'Bearer ';
const accessTokenStorageField = 'access_token';

export function httpAuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (!isUrlWithinBase(req.url, environment.restApiEndpoint)) {
    return next(req);
  }

  const accessToken = inject(OAuthStorage).getItem(accessTokenStorageField);
  let url = req.url;
  if (environment.enableApiAuthRouteSplitting) {
    const parsedUrl = new URL(url);
    parsedUrl.pathname = addApiRoutePrefix(parsedUrl.pathname, !!accessToken);
    url = parsedUrl.toString();
  }

  return next(
    req.clone({
      url,
      setHeaders: accessToken && !req.headers.has(authorizationKey) ? { [authorizationKey]: `${bearerPrefix}${accessToken}` } : undefined,
    }),
  );
}
