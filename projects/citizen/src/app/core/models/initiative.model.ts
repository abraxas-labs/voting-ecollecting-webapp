/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Collection, mapCollectionToModel } from './collection.model';
import {
  Initiative as InitiativeProto,
  InitiativeCommittee as InitiativeCommitteeProto,
  InitiativeCommitteeMember as InitiativeCommitteeMemberProto,
  InitiativeSubType as InitiativeSubTypeProto,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { StoredFile, Initiative as InitiativeShared, InitiativeSubType } from 'ecollecting-lib';

export { InitiativeProto, InitiativeSubTypeProto };

export interface Initiative extends Omit<InitiativeShared, 'collection'> {
  collection: Collection;
}

export interface InitiativeCommittee {
  committeeLists: StoredFile[];
  committeeMembers: InitiativeCommitteeMember[];
  approvedMembersCountOk: boolean;
  approvedMembersCount: number;
  totalMembersCount: number;
  requiredApprovedMembersCount: number;
}

export interface PendingInitiativeCommitteeMembership {
  initiativeId: string;
  description: string;
  subType?: InitiativeSubType;
  wording: string;
  reason: string;
  link: string;
  firstName: string;
  lastName: string;
  invitedByName: string;
  acceptAcceptedAcrs: string[];
}

export interface InitiativeCommitteeMember extends Omit<InitiativeCommitteeMemberProto.AsObject, 'dateOfBirth'> {
  dateOfBirth: Date;
}

export function mapInitiativeToModel(initiativeProto: InitiativeProto): Initiative {
  const collection = mapCollectionToModel(initiativeProto.collection!);
  return {
    ...initiativeProto.toObject(),
    collection: collection,
  } as Initiative;
}

export function mapInitiativeSubTypeToModel(initiativeSubTypeProto: InitiativeSubTypeProto): InitiativeSubType {
  return {
    ...initiativeSubTypeProto.toObject(),
  } as InitiativeSubType;
}

export function mapInitiativeCommittee(committee: InitiativeCommitteeProto): InitiativeCommittee {
  return {
    ...committee.toObject(),
    committeeMembers: committee.committeeMembers?.map(m => mapInitiativeCommitteeMember(m)),
  } as InitiativeCommittee;
}

function mapInitiativeCommitteeMember(member: InitiativeCommitteeMemberProto): InitiativeCommitteeMember {
  return {
    ...member.toObject(),
    dateOfBirth: member.dateOfBirth!.toDate(),
  };
}
