/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { CertificateServiceClient, GetActiveCertificateRequest } from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ActiveCertificate,
  Certificate,
  CertificateValidationSummary,
  mapToActiveCertificate,
  mapToCertificate,
} from '../models/certificate.model';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private readonly client = inject(CertificateServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/certificates`;
  }

  public async getActive(): Promise<ActiveCertificate> {
    const resp = await lastValueFrom(this.client.getActive(new GetActiveCertificateRequest()));
    return mapToActiveCertificate(resp);
  }

  public validateBackupCertificate(file: File): Promise<CertificateValidationSummary> {
    const formData = new FormData();
    formData.append('file', file);
    return lastValueFrom(this.http.post<CertificateValidationSummary>(`${this.restApiUrl}/backup/validate`, formData));
  }

  public setBackupCertificate(file: File, label?: string): Promise<CertificateValidationSummary> {
    const formData = new FormData();
    formData.append('file', file);
    if (label) {
      formData.append('label', label);
    }

    return lastValueFrom(this.http.post<CertificateValidationSummary>(`${this.restApiUrl}/backup`, formData));
  }

  public async list(): Promise<Certificate[]> {
    const resp = await lastValueFrom(this.client.list(new GetActiveCertificateRequest()));
    return resp.certificates!.map(c => mapToCertificate(c));
  }
}
