/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { UserNavigationComponent } from './user-navigation/user-navigation.component';
import { IsAuthenticatedGuard } from '../core/guards/is-authenticated.guard';
import { hasUnsavedChangesGuard } from '../core/guards/has-unsaved-changes.guard';
import { InitiativeService } from '../core/services/initiative.service';
import { ReferendumService } from '../core/services/referendum.service';
import { inject } from '@angular/core';
import { getEntityResolver } from 'ecollecting-lib';

export const signCollectionUrl: string = 'sign-collection';
export const endedCollectionsUrl: string = 'ended-collections';
export const idUrlSegment: string = ':id';
export const seekReferendumUrl: string = 'seek-referendum';
export const launchInitiativeUrl: string = 'launch-initiative';

export const detailOverviewUrl: string = 'overview';
export const detailGeneralInformationUrl: string = 'general-information';
export const detailPermissionsUrl: string = 'permissions';
export const detailSignatureSheetUrl: string = 'signature-sheet';
export const detailCommitteeUrl: string = 'committee';
export const signInitiativeUrl: string = 'sign-initiative';
export const signReferendumUrl: string = 'sign-referendum';

export const routes: Routes = [
  {
    path: '',
    component: UserNavigationComponent,
    canActivate: [IsAuthenticatedGuard()],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: signCollectionUrl,
      },
      {
        path: signCollectionUrl,
        loadComponent: () =>
          import('./sign-collection/sign-collection-overview-page/sign-collection-overview-page.component').then(
            m => m.SignCollectionOverviewPageComponent,
          ),
      },
      {
        path: endedCollectionsUrl,
        loadComponent: () =>
          import('./ended-collections-overview-page/ended-collections-overview-page.component').then(
            m => m.EndedCollectionsOverviewPageComponent,
          ),
      },
      {
        path: seekReferendumUrl,
        loadComponent: () =>
          import('./user-seek-referendum/seek-referendum-overview/seek-referendum-overview.component').then(
            x => x.SeekReferendumOverviewComponent,
          ),
      },
      {
        path: [seekReferendumUrl, idUrlSegment].join('/'),
        canActivate: [IsAuthenticatedGuard()],
        resolve: {
          referendum: getEntityResolver(ReferendumService),
        },
        data: {
          hideNavigation: true,
        },
        loadComponent: () =>
          import('./user-seek-referendum/seek-referendum-detail/seek-referendum-detail.component').then(
            x => x.SeekReferendumDetailComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: detailOverviewUrl,
          },
          {
            path: detailOverviewUrl,
            loadComponent: () =>
              import(
                './user-seek-referendum/seek-referendum-detail/seek-referendum-detail-overview/seek-referendum-detail-overview.component'
              ).then(m => m.SeekReferendumDetailOverviewComponent),
          },
          {
            path: detailGeneralInformationUrl,
            canDeactivate: [hasUnsavedChangesGuard],
            loadComponent: () =>
              import(
                './user-seek-referendum/seek-referendum-detail/seek-referendum-detail-general-information/seek-referendum-detail-general-information.component'
              ).then(m => m.SeekReferendumDetailGeneralInformationComponent),
          },
          {
            path: detailSignatureSheetUrl,
            loadComponent: () =>
              import('../core/components/collection-detail-signature-sheet/collection-detail-signature-sheet.component').then(
                m => m.CollectionDetailSignatureSheetComponent,
              ),
          },
          {
            path: detailPermissionsUrl,
            loadComponent: () =>
              import('../core/components/collection-detail-permissions/collection-detail-permissions.component').then(
                m => m.CollectionDetailPermissionsComponent,
              ),
          },
        ],
      },
      {
        path: launchInitiativeUrl,
        loadComponent: () =>
          import('./user-launch-initiative/launch-initiative-overview/launch-initiative-overview.component').then(
            x => x.LaunchInitiativeOverviewComponent,
          ),
      },
      {
        path: [launchInitiativeUrl, idUrlSegment].join('/'),
        canActivate: [IsAuthenticatedGuard()],
        resolve: {
          initiative: getEntityResolver(InitiativeService),
        },
        data: {
          hideNavigation: true,
        },
        loadComponent: () =>
          import('./user-launch-initiative/launch-initiative-detail/launch-initiative-detail.component').then(
            x => x.LaunchInitiativeDetailComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: detailOverviewUrl,
          },
          {
            path: detailOverviewUrl,
            loadComponent: () =>
              import(
                './user-launch-initiative/launch-initiative-detail/launch-initiative-detail-overview/launch-initiative-detail-overview.component'
              ).then(m => m.LaunchInitiativeDetailOverviewComponent),
          },
          {
            path: detailGeneralInformationUrl,
            canDeactivate: [hasUnsavedChangesGuard],
            loadComponent: () =>
              import(
                './user-launch-initiative/launch-initiative-detail/launch-initiative-detail-general-information/launch-initiative-detail-general-information.component'
              ).then(m => m.LaunchInitiativeDetailGeneralInformationComponent),
          },
          {
            path: detailCommitteeUrl,
            loadComponent: () =>
              import(
                './user-launch-initiative/launch-initiative-detail/launch-initiative-detail-committee/launch-initiative-detail-committee.component'
              ).then(m => m.LaunchInitiativeDetailCommitteeComponent),
          },
          {
            path: detailSignatureSheetUrl,
            loadComponent: () =>
              import('../core/components/collection-detail-signature-sheet/collection-detail-signature-sheet.component').then(
                m => m.CollectionDetailSignatureSheetComponent,
              ),
          },
          {
            path: detailPermissionsUrl,
            loadComponent: () =>
              import('../core/components/collection-detail-permissions/collection-detail-permissions.component').then(
                m => m.CollectionDetailPermissionsComponent,
              ),
          },
        ],
      },
      {
        path: [signInitiativeUrl, idUrlSegment].join('/'),
        loadComponent: () => import('./sign-collection/sign-initiative/sign-initiative.component').then(m => m.SignInitiativeComponent),
        resolve: {
          initiative: (route: ActivatedRouteSnapshot) => inject(InitiativeService).get(route.params['id'], true, true),
        },
        data: {
          hideNavigation: true,
        },
      },
      {
        path: [signReferendumUrl, idUrlSegment].join('/'),
        loadComponent: () => import('./sign-collection/sign-referendum/sign-referendum.component').then(m => m.SignReferendumComponent),
        resolve: {
          referendum: (route: ActivatedRouteSnapshot) => inject(ReferendumService).get(route.params['id'], true),
        },
        data: {
          hideNavigation: true,
        },
      },
    ],
  },
];
