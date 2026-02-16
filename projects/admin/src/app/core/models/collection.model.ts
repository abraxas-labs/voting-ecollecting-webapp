/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  Collection as CollectionProto,
  CollectionCount as CollectionCountProto,
  CollectionMunicipality as CollectionMunicipalityProto,
  CollectionPermission as CollectionPermissionProto,
  CollectionSignatureSheet as CollectionSignatureSheetProto,
  CollectionSignatureSheetCandidate as CollectionSignatureSheetCandidateProto,
  CollectionSignatureSheetState,
  SubmitCollectionMunicipalitySignatureSheetsResponse as SubmitCollectionMunicipalitySignatureSheetsResponseProto,
  SubmitSignatureSheetsResponse as SubmitSignatureSheetsResponseProto,
} from '@abraxas/voting-ecollecting-proto/admin';
import { Collection as CollectionShared } from 'projects/ecollecting-lib/src/lib/shared/models/collection.model';
import { CollectionPermissionRole } from '@abraxas/voting-ecollecting-proto';
import { mapToPerson, Person } from './person.model';
import { CollectionCount, fromProtoDate } from 'ecollecting-lib';

export { CollectionProto };

export interface CollectionSignatureSheetNumberInfo {
  number: number;
  municipalityName: string;
  bfs: string;
}

export interface CollectionSignatureSheet {
  id: string;
  number: number;
  receivedAt: Date;
  attestedAt?: Date;
  createdByName: string;
  modifiedByName?: string;
  municipalityName: string;
  bfs: string;
  count: {
    total: number;
    valid: number;
    invalid: number;
  };
  userPermissions?: CollectionSignatureSheetUserPermission;
  state: CollectionSignatureSheetState;
  modifiedBySuperiorAuthority: boolean;
}

export interface CollectionSignatureSheetCandidate {
  person: Person;
  existingSignature?: CollectionSignatureSheetCandidateExistingSignature;
}

export interface CollectionSignatureSheetCandidateExistingSignature {
  bfs: string;
  municipalityName: string;
  collectionDescription: string;
  electronic: boolean;
  signatureSheetNumber?: number;
  collectionDateTime: Date;
  isInSameMunicipality: boolean;
  isOnSameSheet: boolean;
}

export interface CollectionSignatureSheetUserPermission {
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canUnsubmit: boolean;
  canDiscard: boolean;
  canRestore: boolean;
  canConfirm: boolean;
}

export interface CollectionPermission {
  fullName: string;
  email: string;
  role: CollectionPermissionRole;
}

export interface CollectionUserPermissions {
  canEdit: boolean;
  isRequestInformalReviewVisible: boolean;
  canCreateMessages: boolean;
  canFinishCorrection: boolean;
  canSetCollectionPeriod: boolean;
  canEnable: boolean;
  canDelete: boolean;
  canDeleteWithdrawn: boolean;
  canAddSignatureSheet: boolean;
  canReadSignatureSheets: boolean;
  canCheckSamples: boolean;
  canSubmitSignatureSheets: boolean;
  canFinish: boolean;
  canGenerateDocuments: boolean;
  canEditAdmissibilityDecision: boolean;
  canDeleteAdmissibilityDecision: boolean;
  canEditGeneralInformation: boolean;
  canReturnForCorrection: boolean;
}

export interface CollectionMunicipality {
  bfs: string;
  municipalityName: string;
  physicalCount: {
    total: number;
    valid: number;
    invalid: number;
  };
  totalValidCitizenCount: number;
  electronicCitizenCount: number;
  isLocked: boolean;
  signatureSheetsCount: {
    totalSignatureSheetsCount: number;
    totalSubmittedOrConfirmedSignatureSheetsCount: number;
    totalNotSubmittedSignatureSheetsCount: number;
    totalConfirmedSignatureSheetsCount: number;
  };
}

export interface Collection extends CollectionShared {
  userPermissions?: CollectionUserPermissions;
  secureIdNumber?: string;
}

export interface SubmitSignatureSheetsResponse {
  userPermissions: CollectionUserPermissions;
}

export interface SubmitCollectionMunicipalitySignatureSheetsResponse
  extends Omit<SubmitCollectionMunicipalitySignatureSheetsResponseProto, 'municipality' | 'collectionCount'> {
  municipality: CollectionMunicipality;
  collectionCount: CollectionCount;
}

export function mapCollectionToModel(collectionProto: CollectionProto): Collection {
  return {
    ...collectionProto.toObject(),
    collectionStartDate: fromProtoDate(collectionProto.collectionStartDate),
    collectionEndDate: fromProtoDate(collectionProto.collectionEndDate),
  } as Collection;
}

export function mapToCollectionPermissions(collectionPermissions: CollectionPermissionProto[] | undefined): CollectionPermission[] {
  return collectionPermissions?.map(x => mapToCollectionPermission(x)) ?? [];
}

export function mapToCollectionPermission(collectionPermission: CollectionPermissionProto): CollectionPermission {
  return {
    ...collectionPermission.toObject(),
  } as CollectionPermission;
}

export function mapToCollectionSignatureSheets(sheets: CollectionSignatureSheetProto[] | undefined): CollectionSignatureSheet[] {
  return sheets?.map(x => mapToCollectionSignatureSheet(x)) ?? [];
}

export function mapToCollectionSignatureSheet(sheet: CollectionSignatureSheetProto): CollectionSignatureSheet {
  return {
    ...sheet.toObject(),
    receivedAt: fromProtoDate(sheet.receivedAt),
    attestedAt: sheet.attestedAt?.toDate(),
    modifiedByName: sheet.modifiedByName,
    userPermissions: sheet.userPermissions?.toObject(),
  } as CollectionSignatureSheet;
}

export function mapToSubmitSignatureSheetsResponse(response: SubmitSignatureSheetsResponseProto): SubmitSignatureSheetsResponse {
  return {
    ...response.toObject(),
  } as SubmitSignatureSheetsResponse;
}

export function mapToCollectionSignatureSheetCandidates(
  candidates: CollectionSignatureSheetCandidateProto[],
): CollectionSignatureSheetCandidate[] {
  return candidates.map(c => ({
    existingSignature: !c.existingSignature
      ? undefined
      : {
          ...c.existingSignature.toObject(),
          collectionDateTime: c.existingSignature.collectionDateTime!.toDate(),
        },
    person: mapToPerson(c.person!),
  }));
}

export function mapToMunicipality(municipality: CollectionMunicipalityProto): CollectionMunicipality {
  return {
    ...municipality.toObject(),
  } as CollectionMunicipality;
}

export function mapToSubmitCollectionMunicipalitySignatureSheetsResponse(
  response: SubmitCollectionMunicipalitySignatureSheetsResponseProto,
): SubmitCollectionMunicipalitySignatureSheetsResponse {
  return {
    ...response.toObject(),
    municipality: mapToMunicipality(response.municipality!),
    collectionCount: mapToCollectionCount(response.collectionCount!),
  } as SubmitCollectionMunicipalitySignatureSheetsResponse;
}

export function mapToCollectionCount(collectionCount: CollectionCountProto): CollectionCount {
  return {
    ...collectionCount.toObject(),
  } as CollectionCount;
}
