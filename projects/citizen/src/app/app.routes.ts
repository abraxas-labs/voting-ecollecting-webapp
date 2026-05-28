/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { NotFoundPageComponent } from '@abraxas/voting-lib';
import { launchInitiativeUrl, seekReferendumUrl } from './user/user.routes';
import { AccessibilityPageComponent } from './core/components/accessibility-page/accessibility-page.component';
import { SitemapPageComponent } from './core/components/sitemap-page/sitemap-page.component';

export const accessibilityUrl = 'accessibility';
export const sitemapUrl = 'sitemap';
export const userUrl = 'user';
export const overviewUrl = 'overview';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: overviewUrl,
  },
  {
    // this path is sent in emails, do not change!
    path: 'initiatives/:id',
    redirectTo: redirectData =>
      `/user/${launchInitiativeUrl}/${redirectData.params['id']}?${new URLSearchParams(redirectData.queryParams).toString()}`,
  },
  {
    // this path is sent in emails, do not change!
    path: 'referendums/:id',
    redirectTo: redirectData =>
      `/user/${seekReferendumUrl}/${redirectData.params['id']}?${new URLSearchParams(redirectData.queryParams).toString()}`,
  },
  {
    // this path is sent in emails, do not change!
    path: 'permission-approval',
    title: 'APP.TITLES.PERMISSION_APPROVAL',
    loadChildren: () => import('./permission-approval/permission-approval.routes').then(x => x.routes),
  },
  {
    // this path is sent in emails, do not change!
    path: 'initiative-committee-membership-approval',
    title: 'APP.TITLES.INITIATIVE_COMMITTEE_MEMBERSHIP_APPROVAL',
    loadChildren: () => import('./initiative-committee-member-approval/initiative-committee-member-approval.routes').then(x => x.routes),
  },
  {
    path: 'overview',
    title: 'APP.TITLES.OVERVIEW',
    loadChildren: () => import('./overview/overview.routes').then(x => x.routes),
  },
  {
    path: userUrl,
    loadChildren: () => import('./user/user.routes').then(x => x.routes),
  },
  {
    path: accessibilityUrl,
    title: 'APP.TITLES.ACCESSIBILITY',
    component: AccessibilityPageComponent,
  },
  {
    path: sitemapUrl,
    title: 'APP.TITLES.SITEMAP',
    component: SitemapPageComponent,
  },
  {
    path: '**',
    component: NotFoundPageComponent,
    data: { hideHeader: true },
  },
];
