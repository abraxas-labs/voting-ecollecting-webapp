/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  CollectionPeriodState,
  CollectionPermissionRole,
  CollectionPermissionState,
  CollectionState,
  DecreeState,
  InitiativeCommitteeMemberApprovalState,
  InitiativeCommitteeMemberSignatureType,
} from '@abraxas/voting-ecollecting-proto';

export const signatureTypeColorMap: Record<string, string> = {
  [InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UNSPECIFIED]: '#724CC5',
  [InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UPLOADED_SIGNATURE]: '#9c5f16',
  [InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_VERIFIED_IAM_IDENTITY]: '#724CC5',
};

export const approvalStateColorMap: Record<string, string> = {
  [InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED]: '#dceaf9',
  [InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED]: '#ffeacc',
  [InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNATURE_REJECTED]: '#f7e3e3',
  [InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_APPROVED]: '#d6efdf',
  [InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REJECTED]: '#f7e3e3',
  [InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_EXPIRED]: '#f7e3e3',
};

export const collectionStateColorMap: Record<string, string> = {
  [CollectionState.COLLECTION_STATE_PRE_RECORDED]: '#ffeacc',
  [CollectionState.COLLECTION_STATE_IN_PREPARATION]: '#ffeacc',
  [CollectionState.COLLECTION_STATE_WITHDRAWN]: '', // no background color
  [CollectionState.COLLECTION_STATE_SUBMITTED]: '#dceaf9',
  [CollectionState.COLLECTION_STATE_NOT_PASSED]: '', // no background color
  [CollectionState.COLLECTION_STATE_RETURNED_FOR_CORRECTION]: '#ffeacc',
  [CollectionState.COLLECTION_STATE_UNDER_REVIEW]: '#dceaf9',
  [CollectionState.COLLECTION_STATE_READY_FOR_REGISTRATION]: '#d6efdf',
  [CollectionState.COLLECTION_STATE_REGISTERED]: '#d6efdf',
  [CollectionState.COLLECTION_STATE_PREPARING_FOR_COLLECTION]: '#d6efdf',
  [CollectionState.COLLECTION_STATE_ENABLED_FOR_COLLECTION]: '#d6efdf',
  [CollectionState.COLLECTION_STATE_SIGNATURE_SHEETS_SUBMITTED]: '#d6efdf',
  [CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT]: '#298140',
  [CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT]: '#d12a33',
};

export const collectionPeriodStateColorMap: Record<string, string> = {
  [CollectionPeriodState.COLLECTION_PERIOD_STATE_PUBLISHED]: '#ffeacc',
  [CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION]: '#d6efdf',
  [CollectionPeriodState.COLLECTION_PERIOD_STATE_EXPIRED]: '#2e70c6',
};

export const decreeStateColorMap: Record<string, string> = {
  [DecreeState.DECREE_STATE_COLLECTION_APPLICABLE]: '#d6efdf',
  [DecreeState.DECREE_STATE_ENDED_CAME_ABOUT]: '#298140',
  [DecreeState.DECREE_STATE_ENDED_CAME_NOT_ABOUT]: '#d12a33',
};

export const collectionPermissionRoleColorMap: Record<string, string> = {
  [CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_READER]: '#dceaf9',
  [CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_DEPUTY]: '#d6efdf',
  [CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_OWNER]: '', // no background color
};

export const collectionPermissionStateColorMap: Record<string, string> = {
  [CollectionPermissionState.COLLECTION_PERMISSION_STATE_PENDING]: '', // no background color
  [CollectionPermissionState.COLLECTION_PERMISSION_STATE_ACCEPTED]: '#d6efdf',
  [CollectionPermissionState.COLLECTION_PERMISSION_STATE_REJECTED]: '#f7e3e3',
  [CollectionPermissionState.COLLECTION_PERMISSION_STATE_EXPIRED]: '#f7e3e3',
};
