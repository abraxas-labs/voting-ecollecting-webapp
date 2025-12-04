/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { LoadingBarModule } from '@abraxas/base-components';

@Component({
  selector: 'vo-ecol-loading-bar',
  imports: [LoadingBarModule],
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss',
})
export class LoadingBarComponent {
  @Input()
  public loading = true;
}
