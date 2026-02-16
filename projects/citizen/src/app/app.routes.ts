/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { NotFoundPageComponent, ThemeService } from '@abraxas/voting-lib';
import { launchInitiativeUrl, seekReferendumUrl } from './user/user.routes';
import { AccessibilityPageComponent } from './core/components/accessibility-page/accessibility-page.component';

export const accessibilityUrl = 'accessibility';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ThemeService.NoTheme,
  },
  {
    path: ':theme',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
      {
        // this path is sent in emails, do not change!
        path: 'initiatives/:id',
        redirectTo: redirectData =>
          `/-/user/${launchInitiativeUrl}/${redirectData.params['id']}?${new URLSearchParams(redirectData.queryParams).toString()}`,
      },
      {
        // this path is sent in emails, do not change!
        path: 'referendums/:id',
        redirectTo: redirectData =>
          `/-/user/${seekReferendumUrl}/${redirectData.params['id']}?${new URLSearchParams(redirectData.queryParams).toString()}`,
      },
      {
        // this path is sent in emails, do not change!
        path: 'permission-approval',
        loadChildren: () => import('./permission-approval/permission-approval.routes').then(x => x.routes),
      },
      {
        // this path is sent in emails, do not change!
        path: 'initiative-committee-membership-approval',
        loadChildren: () =>
          import('./initiative-committee-member-approval/initiative-committee-member-approval.routes').then(x => x.routes),
      },
      {
        path: 'overview',
        loadChildren: () => import('./overview/overview.routes').then(x => x.routes),
      },
      {
        path: 'user',
        loadChildren: () => import('./user/user.routes').then(x => x.routes),
      },
      {
        path: accessibilityUrl,
        component: AccessibilityPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
        data: { hideHeader: true },
      },
    ],
  },
];
