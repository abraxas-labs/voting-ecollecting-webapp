/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { CertificatesComponent } from './certificates/certificates.component';
import { DecreeOverviewComponent } from './decrees/decree-overview/decree-overview.component';
import { DefaultRedirectGuard } from './guards/default-redirect.guard';
import { AdmissibilityDecisionsComponent } from './admissibility-decisions/admissibility-decisions.component';
import { SettingsComponent } from './settings/settings.component';
import { RoleGuard } from './guards/role.guard';
import { Role } from '../core/roles.model';

export const certificatesUrl = 'certificates';
export const decreesUrl = 'decrees';
export const admissibilityDecisionsUrl = 'admissibility-decisions';
export const settingsUrl = 'settings';

export const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    data: {
      largeView: true,
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [DefaultRedirectGuard],
      },
      {
        path: certificatesUrl,
        component: CertificatesComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'Zertifikatsverwalter' satisfies Role,
        },
      },
      {
        path: decreesUrl,
        component: DecreeOverviewComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'Stammdatenverwalter' satisfies Role,
        },
      },
      {
        path: admissibilityDecisionsUrl,
        component: AdmissibilityDecisionsComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'Stammdatenverwalter' satisfies Role,
        },
      },
      {
        path: settingsUrl,
        component: SettingsComponent,
        canActivate: [RoleGuard],
        data: {
          role: 'Stammdatenverwalter' satisfies Role,
        },
      },
    ],
  },
];
