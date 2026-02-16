/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionPeriodState, CollectionState, CollectionType } from '@abraxas/voting-ecollecting-proto';
import { StoredFile } from './file.model';
import { CollectionSignatureType } from '@abraxas/voting-ecollecting-proto/citizen';

export interface Collection {
  id: string;
  description: string;
  type: CollectionType;
  reason: string;
  link: string;
  image?: StoredFile;
  logo?: StoredFile;
  signatureSheetTemplateGenerated: boolean;
  signatureSheetTemplate?: StoredFile;
  state: CollectionState;
  address: CollectionAddress;
  isElectronicSubmission: boolean;
  informalReviewRequested: boolean;
  attestedCollectionCount?: CollectionCount;
  isSigned?: boolean;
  signatureType?: CollectionSignatureType;
  signAcceptedAcrs?: string[];
  collectionStartDate?: Date;
  collectionEndDate?: Date;
  periodState: CollectionPeriodState;
}

export interface CollectionAddress {
  committeeOrPerson: string;
  streetOrPostOfficeBox: string;
  zipCode: string;
  locality: string;
}

export function isAddressComplete(address: CollectionAddress): boolean {
  return !!address.committeeOrPerson && !!address.streetOrPostOfficeBox && !!address.zipCode && !!address.locality;
}

export interface CollectionCount {
  electronicCitizenCount: number;
  totalCitizenCount?: number;
}
