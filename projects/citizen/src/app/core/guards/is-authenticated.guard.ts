/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

export function IsAuthenticatedGuard(launchLoginFlowIfUnauthenticated: boolean = true): CanActivateFn {
  return async function (_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const service = inject(AuthenticationService);
    const ok = service.isAuthenticated || (await service.tryLogin());
    if (ok) {
      return true;
    }

    if (launchLoginFlowIfUnauthenticated) {
      await service.login({ routerState: state });
    }

    return false;
  };
}
