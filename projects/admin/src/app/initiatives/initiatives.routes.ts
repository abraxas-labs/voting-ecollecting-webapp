/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { InitiativeOverviewComponent } from './initiative-overview/initiative-overview.component';
import { getEntityResolver } from 'ecollecting-lib';
import { InitiativeService } from '../core/services/initiative.service';
import { signatureSheetsUrl } from '../signature-sheets/signature-sheets.routes';
import { checkSamplesUrl } from '../check-samples/check-samples.routes';

export const idUrlSegment: string = ':id';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: InitiativeOverviewComponent,
  },
  {
    path: idUrlSegment,
    resolve: {
      initiative: getEntityResolver(InitiativeService),
    },
    data: {
      hideNavigation: true,
    },

    loadComponent: () => import('./initiative-detail/initiative-detail.component').then(x => x.InitiativeDetailComponent),
  },
  {
    path: idUrlSegment + '/' + signatureSheetsUrl,
    resolve: {
      collection: getEntityResolver(InitiativeService),
    },
    data: {
      hideNavigation: true,
    },
    loadChildren: () => import('../signature-sheets/signature-sheets.routes').then(x => x.routes),
  },
  {
    path: idUrlSegment + '/' + checkSamplesUrl,
    resolve: {
      collection: getEntityResolver(InitiativeService),
    },
    data: {
      hideNavigation: true,
    },
    loadChildren: () => import('../check-samples/check-samples.routes').then(x => x.routes),
  },
];
