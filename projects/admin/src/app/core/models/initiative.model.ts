/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Collection, mapCollectionToModel } from './collection.model';
import {
  InitiativeSubType as InitiativeSubTypeProto,
  InitiativeGroup as InitiativeGroupProto,
  Initiative as InitiativeProto,
  InitiativeCommittee as InitiativeCommitteeProto,
  InitiativeCommitteeMember as InitiativeCommitteeMemberProto,
  VerifyInitiativeCommitteeMemberResponse as VerifyInitiativeCommitteeMemberResponseProto,
  AdmissibilityDecisionState,
} from '@abraxas/voting-ecollecting-proto/admin';
import { StoredFile, fromProtoDate, Initiative as InitiativeShared, InitiativeSubType } from 'ecollecting-lib';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

export { InitiativeProto, InitiativeGroupProto };

export interface InitiativeGroup {
  domainOfInfluenceType: DomainOfInfluenceType;
  initiatives: Initiative[];
}

export interface Initiative extends Omit<InitiativeShared, 'collection'> {
  collection: Collection;
  admissibilityDecisionState?: AdmissibilityDecisionState;
  sensitiveDataExpiryDate?: Date;
}

export interface InitiativeCommittee {
  committeeLists: StoredFile[];
  committeeMembers: InitiativeCommitteeMember[];
  approvedMembersCountOk: boolean;
  approvedMembersCount: number;
  totalMembersCount: number;
  requiredApprovedMembersCount: number;
}

export interface InitiativeCommitteeMember extends Omit<InitiativeCommitteeMemberProto.AsObject, 'dateOfBirth'> {
  dateOfBirth: Date;
}

export interface VerifyInitiativeCommitteeMemberResponse
  extends Omit<VerifyInitiativeCommitteeMemberResponseProto.AsObject, 'dateOfBirth'> {
  dateOfBirth: Date;
}

export function mapInitiativeSubTypeToModel(initiativeSubTypeProto: InitiativeSubTypeProto): InitiativeSubType {
  return {
    ...initiativeSubTypeProto.toObject(),
  } as InitiativeSubType;
}

export function mapInitiativeGroupToModel(initiativeGroupProto: InitiativeGroupProto): InitiativeGroup {
  return {
    domainOfInfluenceType: initiativeGroupProto.domainOfInfluenceType,
    initiatives: initiativeGroupProto.initiatives!.map(i => mapInitiativeToModel(i)),
  };
}

export function mapInitiativeToModel(initiativeProto: InitiativeProto): Initiative {
  const collection = mapCollectionToModel(initiativeProto.collection!);
  return {
    ...initiativeProto.toObject(),
    sensitiveDataExpiryDate: fromProtoDate(initiativeProto.sensitiveDataExpiryDate),
    collection: collection,
  } as Initiative;
}

export function mapInitiativeCommittee(committee: InitiativeCommitteeProto): InitiativeCommittee {
  return {
    ...committee.toObject(),
    committeeMembers: committee.committeeMembers?.map(m => mapInitiativeCommitteeMember(m)),
  } as InitiativeCommittee;
}

export function mapVerifyInitiativeCommitteeMemberResponse(
  response: VerifyInitiativeCommitteeMemberResponseProto,
): VerifyInitiativeCommitteeMemberResponse {
  return {
    ...response.toObject(),
    dateOfBirth: response.dateOfBirth!.toDate(),
  };
}

function mapInitiativeCommitteeMember(member: InitiativeCommitteeMemberProto): InitiativeCommitteeMember {
  return {
    ...member.toObject(),
    dateOfBirth: member.dateOfBirth!.toDate(),
  };
}
