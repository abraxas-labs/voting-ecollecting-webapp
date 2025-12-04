/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  Collection as CollectionProto,
  CollectionPermission as CollectionPermissionProto,
  CollectionUserPermissions as CollectionUserPermissionsProto,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { Collection as CollectionShared } from 'projects/ecollecting-lib/src/lib/shared/models/collection.model';
import { CollectionPermissionRole, CollectionType } from '@abraxas/voting-ecollecting-proto';

export { CollectionProto, CollectionPermissionProto, CollectionUserPermissionsProto };

export type CollectionPermission = CollectionPermissionProto.AsObject;

export interface PendingCollectionPermission {
  collectionId: string;
  collectionType: CollectionType;
  collectionDescription: string;
  invitedByName: string;
  lastName: string;
  firstName: string;
  role: CollectionPermissionRole;
  acceptAcceptedAcrs: string[];
}

export interface CollectionUserPermissions {
  role: CollectionPermissionRole;
  canEdit: boolean;
  canEditSignatureSheetTemplate: boolean;
  canDeleteSignatureSheetTemplate: boolean;
  canGenerateSignatureSheetTemplatePreview: boolean;
  canEditPermissions: boolean;
  canCreateMessages: boolean;
  canSubmit: boolean;
  isSubmitVisible: boolean;
  canFlagForReview: boolean;
  isFlagForReviewVisible: boolean;
  canRegister: boolean;
  canWithdraw: boolean;
  canRequestInformalReview: boolean;
  isRequestInformalReviewVisible: boolean;
  isCreator: boolean;
  canEditAdmissibilityDecision: boolean;
  canDeleteAdmissibilityDecision: boolean;
  canDownloadElectronicSignaturesProtocol: boolean;
  canEditSubType: boolean;
}

export interface Collection extends CollectionShared {
  userPermissions?: CollectionUserPermissions;
}

export function mapCollectionToModel(collectionProto: CollectionProto): Collection {
  return {
    ...collectionProto.toObject(),
    collectionStartDate: collectionProto.collectionStartDate?.toDate(),
    collectionEndDate: collectionProto.collectionEndDate?.toDate(),
  } as Collection;
}
