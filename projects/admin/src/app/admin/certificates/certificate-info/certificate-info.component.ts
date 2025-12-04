/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostBinding, Input } from '@angular/core';
import { CertificateInfo } from '../../../core/models/certificate.model';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LabelModule } from '@abraxas/base-components';

@Component({
  selector: 'app-certificate-info',
  imports: [DatePipe, TranslatePipe, LabelModule],
  templateUrl: './certificate-info.component.html',
  styleUrl: './certificate-info.component.scss',
})
export class CertificateInfoComponent {
  @Input({ required: true })
  public certificate!: CertificateInfo;

  @Input()
  public showNotAfter: boolean = true;

  @Input()
  @HostBinding('class.two-col-layout')
  public twoColumnLayout: boolean = true;
}
