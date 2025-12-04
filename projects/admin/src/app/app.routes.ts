/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { AuthThemeGuard, NotFoundPageComponent, ThemeService } from '@abraxas/voting-lib';

export const referendumUrl: string = 'referendums';
export const initiativeUrl: string = 'initiatives';
export const controlSignUrl: string = 'control-signs';
export const administrationUrl: string = 'administration';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ThemeService.NoTheme,
  },
  {
    path: ':theme',
    canActivate: [AuthThemeGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: referendumUrl,
      },
      {
        path: referendumUrl,
        loadChildren: () => import('./referendums/referendums.routes').then(m => m.routes),
      },
      {
        path: initiativeUrl,
        loadChildren: () => import('./initiatives/initiatives.routes').then(m => m.routes),
      },
      {
        path: controlSignUrl,
        loadChildren: () => import('./control-signs/control-signs.routes').then(m => m.routes),
      },
      {
        path: administrationUrl,
        loadChildren: () => import('./admin/admin.routes').then(m => m.routes),
      },
      {
        path: '**',
        component: NotFoundPageComponent,
        data: { hideHeader: true },
      },
    ],
  },
];
