/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthorizationService } from '@abraxas/base-components';
import { certificatesUrl, decreesUrl } from '../admin.routes';
import { Role } from '../../core/roles.model';
import { administrationUrl } from '../../app.routes';

@Injectable({
  providedIn: 'root',
})
export class DefaultRedirectGuard implements CanActivate {
  private readonly auth = inject(AuthorizationService);
  private readonly router = inject(Router);

  public async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    const roles = (await this.auth.getRoles()) as Role[];

    if (roles.includes('Zertifikatsverwalter')) {
      return this.router.createUrlTree(['-', administrationUrl, certificatesUrl]);
    } else if (roles.includes('Stammdatenverwalter')) {
      return this.router.createUrlTree(['-', administrationUrl, decreesUrl]);
    }

    return this.router.createUrlTree(['-', '404']);
  }
}
