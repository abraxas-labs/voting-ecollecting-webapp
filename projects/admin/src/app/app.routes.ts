/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { NotFoundPageComponent } from '@abraxas/voting-lib';
import { IsAuthenticatedGuard } from '@abraxas/base-components';

export const referendumUrl: string = 'referendums';
export const initiativeUrl: string = 'initiatives';
export const controlSignUrl: string = 'control-signs';
export const administrationUrl: string = 'administration';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: referendumUrl,
  },
  {
    path: referendumUrl,
    canActivate: [IsAuthenticatedGuard],
    loadChildren: () => import('./referendums/referendums.routes').then(m => m.routes),
  },
  {
    path: initiativeUrl,
    canActivate: [IsAuthenticatedGuard],
    loadChildren: () => import('./initiatives/initiatives.routes').then(m => m.routes),
  },
  {
    path: controlSignUrl,
    canActivate: [IsAuthenticatedGuard],
    loadChildren: () => import('./control-signs/control-signs.routes').then(m => m.routes),
  },
  {
    path: administrationUrl,
    canActivate: [IsAuthenticatedGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.routes),
  },
  {
    path: '**',
    component: NotFoundPageComponent,
    data: { hideHeader: true },
  },
];
