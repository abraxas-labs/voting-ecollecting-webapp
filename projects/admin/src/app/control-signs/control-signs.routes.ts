/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Routes } from '@angular/router';
import { ControlSignsComponent } from './control-signs.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ControlSignsComponent,
  },
];
