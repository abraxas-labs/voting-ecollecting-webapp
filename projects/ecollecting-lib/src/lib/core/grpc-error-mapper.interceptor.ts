/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { GrpcEvent, GrpcMessage, GrpcRequest, GrpcStatusEvent } from '@ngx-grpc/common';
import { GrpcHandler, GrpcInterceptor } from '@ngx-grpc/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GRPC_ERROR_MAPPER } from '@abraxas/voting-lib';

@Injectable({
  providedIn: 'root',
})
export class GrpcErrorMapperInterceptor implements GrpcInterceptor {
  private readonly errorMapper = inject(GRPC_ERROR_MAPPER, { optional: true });

  public intercept<Q extends GrpcMessage, S extends GrpcMessage>(request: GrpcRequest<Q, S>, next: GrpcHandler): Observable<GrpcEvent<S>> {
    return next.handle(request).pipe(
      switchMap(event => {
        if (event instanceof GrpcStatusEvent && event.statusCode !== 0 && !!this.errorMapper) {
          // map ngx-grpc errors to the vo-lib error type
          const mappedError = this.errorMapper(event);
          if (mappedError) {
            return throwError(() => mappedError);
          }
        }

        return of(event);
      }),
    );
  }
}
