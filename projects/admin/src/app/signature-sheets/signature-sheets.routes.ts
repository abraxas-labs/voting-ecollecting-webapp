/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { CollectionSignatureSheetService } from '../core/services/collection-signature-sheet.service';

export const signatureSheetsUrl: string = 'signature-sheets';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./signature-sheet-overview/signature-sheet-overview.component').then(x => x.SignatureSheetOverviewComponent),
  },
  {
    path: ':sheetId',
    data: {
      hideHeader: true,
    },
    resolve: {
      sheet: (route: ActivatedRouteSnapshot) => inject(CollectionSignatureSheetService).get(route.params['id'], route.params['sheetId']),
    },
    loadComponent: () => import('./signature-sheet-detail/signature-sheet-detail.component').then(x => x.SignatureSheetDetailComponent),
  },
];
