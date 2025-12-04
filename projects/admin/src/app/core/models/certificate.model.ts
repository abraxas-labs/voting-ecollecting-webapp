/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  Certificate as CertificateProto,
  CertificateInfo as CertificateInfoProto,
  GetActiveCertificateResponse,
} from '@abraxas/voting-ecollecting-proto/admin';

export interface CertificateValidationSummary extends CertificateInfo {
  state: 'Ok' | 'Warning' | 'Error';
  validations: CertificateValidation[];
}

export interface CertificateValidation {
  state: 'Ok' | 'Warning' | 'Error';
  validation:
    | 'ContainsSingleEntry'
    | 'Format'
    | 'ContainsNoPrivateKey'
    | 'CertificateNotAfter'
    | 'CACertificateNotAfter'
    | 'CertificateChainValidation';
}

export interface ActiveCertificate {
  activeCertificate: Certificate;
  caCertificate: CertificateInfo;
}

export interface Certificate {
  id: string;
  label: string;
  active: boolean;
  importedByName: string;
  importedAt: Date;
  info: CertificateInfo;
  caInfo: CertificateInfo;
}

export interface CertificateInfo {
  notBefore: Date;
  notAfter: Date;
  thumbprint: string;
  subject: string;
}

export function mapToCertificate(cert: CertificateProto): Certificate {
  return {
    ...cert!.toObject(),
    importedAt: cert!.importedAt!.toDate(),
    info: mapToCertificateInfo(cert!.info!),
    caInfo: mapToCertificateInfo(cert!.caInfo!),
  };
}

export function mapToActiveCertificate(resp: GetActiveCertificateResponse): ActiveCertificate {
  return {
    activeCertificate: mapToCertificate(resp.activeCertificate!),
    caCertificate: mapToCertificateInfo(resp.caCertificate!),
  };
}

function mapToCertificateInfo(resp: CertificateInfoProto): CertificateInfo {
  return {
    notAfter: resp.notAfter!.toDate(),
    notBefore: resp.notBefore!.toDate(),
    subject: resp.subject,
    thumbprint: resp.thumbprint,
  };
}
