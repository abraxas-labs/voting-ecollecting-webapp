/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { ButtonModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-approval-page',
  imports: [ButtonModule, TranslatePipe, SpinnerModule],
  templateUrl: './approval-page.component.html',
  styleUrl: './approval-page.component.scss',
})
export class ApprovalPageComponent {
  @Input()
  public header: string = '';

  @Input()
  public hint: string = '';

  @Input()
  public subHeader: string = '';

  @Input()
  public notFound = false;

  @Input()
  public notFoundHeader = '';

  @Input()
  public notFoundDetail = '';

  @Input()
  public loading = true;
}
