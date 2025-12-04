/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ActiveCertificatesComponent } from './active-certificates/active-certificates.component';
import { CertificateService } from '../../core/services/certificate.service';
import { Certificate } from '../../core/models/certificate.model';
import { CertificatesListComponent } from './certificates-list/certificates-list.component';
import { SpinnerModule } from '@abraxas/base-components';

@Component({
  selector: 'app-certificates',
  imports: [TranslatePipe, ActiveCertificatesComponent, CertificatesListComponent, SpinnerModule],
  templateUrl: './certificates.component.html',
})
export class CertificatesComponent implements OnInit {
  private readonly certsService = inject(CertificateService);

  protected loading = false;
  protected certificates: Certificate[] = [];

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading = true;
    try {
      this.certificates = await this.certsService.list();
    } finally {
      this.loading = false;
    }
  }
}
