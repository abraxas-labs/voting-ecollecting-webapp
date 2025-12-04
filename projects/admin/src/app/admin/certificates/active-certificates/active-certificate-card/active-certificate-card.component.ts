/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { IconModule } from '@abraxas/base-components';

@Component({
  selector: 'app-active-certificate-card',
  imports: [TranslatePipe, DecimalPipe, IconModule],
  templateUrl: './active-certificate-card.component.html',
  styleUrl: './active-certificate-card.component.scss',
})
export class ActiveCertificateCardComponent implements OnInit {
  @Input({ required: true })
  public label!: string;

  @Input({ required: true })
  public notAfter!: Date;

  @Input({ required: true })
  public numberOfDaysWarning!: number;

  @Input({ required: true })
  public numberOfDaysError!: number;

  @HostBinding('class')
  protected state: 'ok' | 'warning' | 'error' = 'ok';
  protected daysRemaining!: number;

  public ngOnInit(): void {
    const now = new Date();
    const msRemaining = this.notAfter.getTime() - now.getTime();
    this.daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    if (this.daysRemaining < this.numberOfDaysError) {
      this.state = 'error';
    } else if (this.daysRemaining < this.numberOfDaysWarning) {
      this.state = 'warning';
    }
  }
}
