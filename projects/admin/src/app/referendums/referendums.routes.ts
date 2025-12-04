/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { ReferendumOverviewComponent } from './referendum-overview/referendum-overview.component';
import { ReferendumService } from '../core/services/referendum.service';
import { getEntityResolver } from 'ecollecting-lib';
import { signatureSheetsUrl } from '../signature-sheets/signature-sheets.routes';
import { checkSamplesUrl } from '../check-samples/check-samples.routes';

export const idUrlSegment: string = ':id';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ReferendumOverviewComponent,
  },
  {
    path: idUrlSegment,
    resolve: {
      referendum: getEntityResolver(ReferendumService),
    },
    data: {
      hideNavigation: true,
    },
    loadComponent: () => import('./referendum-detail/referendum-detail.component').then(x => x.ReferendumDetailComponent),
  },
  {
    path: idUrlSegment + '/' + signatureSheetsUrl,
    resolve: {
      collection: getEntityResolver(ReferendumService),
    },
    data: {
      hideNavigation: true,
    },
    loadChildren: () => import('../signature-sheets/signature-sheets.routes').then(x => x.routes),
  },
  {
    path: idUrlSegment + '/' + checkSamplesUrl,
    resolve: {
      collection: getEntityResolver(ReferendumService),
    },
    data: {
      hideNavigation: true,
    },
    loadChildren: () => import('../check-samples/check-samples.routes').then(x => x.routes),
  },
];
