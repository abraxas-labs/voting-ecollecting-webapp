/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { LowerCasePipe, NgClass } from '@angular/common';
import { IconModule, LabelModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { CertificateValidationSummary } from '../../../../core/models/certificate.model';

@Component({
  selector: 'app-new-certificate-validation',
  imports: [IconModule, LabelModule, TranslatePipe, NgClass, LowerCasePipe],
  templateUrl: './new-certificate-validation.component.html',
  styleUrl: './new-certificate-validation.component.scss',
})
export class NewCertificateValidationComponent {
  @Input({ required: true })
  public validation!: CertificateValidationSummary;
}
