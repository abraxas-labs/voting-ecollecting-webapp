/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthorizationService } from '@abraxas/base-components';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  private readonly auth = inject(AuthorizationService);
  private readonly router = inject(Router);

  public async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    const role = route.data['role'];
    if (!role) {
      throw new Error('No role found for this route, ensure a role is set in the route data.');
    }

    if (await this.auth.hasRoleAwaitAuth(role)) {
      return true;
    }

    return this.router.createUrlTree(['-', '404']);
  }
}
