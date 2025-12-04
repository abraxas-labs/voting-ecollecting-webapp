/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Person as PersonProto } from '@abraxas/voting-ecollecting-proto/admin';

export interface PersonFilterData {
  officialName: string;
  firstName: string;
  dateOfBirth?: Date;
  residenceAddressStreet: string;
  residenceAddressHouseNumber: string;
}

export interface Person extends Required<PersonFilterData> {
  registerId: string;
  isVotingAllowed: boolean;
  isBirthDateValidForVotingRights: boolean;
  isNationalityValidForVotingRights: boolean;
  reviewState?: PersonReviewState;
}

export enum PersonReviewState {
  Added = 'added',
  Removed = 'removed',
  Confirmed = 'confirmed',
}

export function mapToPerson(p: PersonProto): Person {
  return {
    ...p.toObject(),
    dateOfBirth: p.dateOfBirth!.toDate(),
  };
}
