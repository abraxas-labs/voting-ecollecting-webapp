/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { DomainOfInfluenceService } from '../core/services/domain-of-influence.service';
import { CollectionSignatureSheetService } from '../core/services/collection-signature-sheet.service';

export const checkSamplesUrl: string = 'check-samples';
export const samplesUrl: string = 'samples';
export const bfsUrlSegment: string = ':bfs';
export const sheetIdSegment: string = ':sheetId';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./check-samples-overview/check-samples-overview.component').then(x => x.CheckSamplesOverviewComponent),
  },
  {
    path: samplesUrl,
    loadComponent: () => import('./check-samples-samples/check-samples-samples.component').then(x => x.CheckSamplesSamplesComponent),
  },
  {
    path: bfsUrlSegment,
    resolve: {
      domainOfInfluence: (route: ActivatedRouteSnapshot) => inject(DomainOfInfluenceService).get(route.params['bfs']),
    },
    loadComponent: () =>
      import('./check-samples-municipality-overview/check-samples-municipality-overview.component').then(
        x => x.CheckSamplesMunicipalityOverviewComponent,
      ),
  },
  {
    path: [bfsUrlSegment, sheetIdSegment].join('/'),
    data: {
      hideHeader: true,
    },
    resolve: {
      sheet: (route: ActivatedRouteSnapshot) => inject(CollectionSignatureSheetService).get(route.params['id'], route.params['sheetId']),
    },
    loadComponent: () =>
      import('./check-samples-signature-sheet-detail/check-samples-signature-sheet-detail.component').then(
        x => x.CheckSamplesSignatureSheetDetailComponent,
      ),
  },
];
