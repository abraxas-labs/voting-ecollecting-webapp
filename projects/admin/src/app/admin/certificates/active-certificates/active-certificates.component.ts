/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule, DialogService, ErrorModule, LabelModule, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { CertificateService } from '../../../core/services/certificate.service';
import { isGrpcNotFoundError, ToastService } from 'ecollecting-lib';
import { DatePipe } from '@angular/common';
import { ActiveCertificateCardComponent } from './active-certificate-card/active-certificate-card.component';
import { NewCertificateDialogComponent } from '../new-certificate-dialog/new-certificate-dialog.component';
import { firstValueFrom } from 'rxjs';
import { ActiveCertificate } from '../../../core/models/certificate.model';

@Component({
  selector: 'app-active-certificates',
  imports: [TranslatePipe, ReadonlyModule, LabelModule, DatePipe, ErrorModule, ActiveCertificateCardComponent, ButtonModule, SpinnerModule],
  templateUrl: './active-certificates.component.html',
  styleUrl: './active-certificates.component.scss',
  providers: [DialogService],
})
export class ActiveCertificatesComponent implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly toast = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  protected activeCertificate?: ActiveCertificate;
  protected notFound = false;

  @Output()
  public certificateImported: EventEmitter<void> = new EventEmitter<void>();

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  protected async copy(data: string): Promise<void> {
    await navigator.clipboard.writeText(data);
    this.toast.success('ADMIN.CERTS.ACTIVE.COPIED');
  }

  protected async importNew(): Promise<void> {
    const ref = this.dialogService.open(NewCertificateDialogComponent, {});
    const imported = await firstValueFrom(ref.afterClosed());
    if (imported) {
      this.certificateImported.emit();
      await this.loadData();
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.notFound = false;
      this.activeCertificate = await this.certificateService.getActive();
    } catch (e) {
      if (!isGrpcNotFoundError(e)) {
        throw e;
      }

      this.notFound = true;
    }
  }
}
