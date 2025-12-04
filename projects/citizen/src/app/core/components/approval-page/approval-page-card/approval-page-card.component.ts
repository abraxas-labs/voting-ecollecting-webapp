/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { ButtonModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-approval-page-card',
  imports: [ButtonModule, TranslatePipe],
  templateUrl: './approval-page-card.component.html',
  styleUrl: './approval-page-card.component.scss',
})
export class ApprovalPageCardComponent {
  @Input({ required: true })
  public header: string = '';

  @Input()
  public hint?: string;

  @Input()
  public error?: string;

  @Input()
  public success?: string;
}
