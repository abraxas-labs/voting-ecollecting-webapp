/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthenticationService, AuthorizationService, Tenant } from '@abraxas/base-components';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { GrpcEvent, GrpcMessage, GrpcRequest } from '@ngx-grpc/common';
import { GrpcHandler, GrpcInterceptor } from '@ngx-grpc/core';
import { from, Observable, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

const tenantKey = 'x-tenant';

@Injectable({
  providedIn: 'root',
})
export class GrpcTenantInterceptor implements GrpcInterceptor, OnDestroy {
  private readonly authorization = inject(AuthorizationService);

  private readonly tenantSubscription: Subscription;
  private readonly isAuthenticated: boolean;
  private tenant?: Tenant;

  constructor() {
    const authentication = inject(AuthenticationService);

    this.isAuthenticated = authentication.authenticated;
    this.tenantSubscription = this.authorization.activeTenantChanged.subscribe(t => (this.tenant = t));
  }

  public ngOnDestroy(): void {
    this.tenantSubscription.unsubscribe();
  }

  public intercept<Q extends GrpcMessage, S extends GrpcMessage>(request: GrpcRequest<Q, S>, next: GrpcHandler): Observable<GrpcEvent<S>> {
    if (!this.isAuthenticated) {
      return next.handle(request);
    }

    return from(this.ensureTenant()).pipe(
      tap(t => this.setTenantIfNotSet(t, request)),
      switchMap(() => next.handle(request)),
    );
  }

  private setTenantIfNotSet<Q extends GrpcMessage, S extends GrpcMessage>(t: Tenant, request: GrpcRequest<Q, S>): void {
    if (!request.requestMetadata.has(tenantKey)) {
      request.requestMetadata.set(tenantKey, t.id);
    }
  }

  private async ensureTenant(): Promise<Tenant> {
    if (this.tenant) {
      return this.tenant;
    }
    this.tenant = await this.authorization.getActiveTenant();
    return this.tenant;
  }
}
