/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Decree as DecreeProto, DecreeGroup as DecreeGroupProto } from '@abraxas/voting-ecollecting-proto/citizen';
import { Decree as DecreeShared } from 'ecollecting-lib';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { mapReferendumToModel, Referendum } from './referendum.model';

export { DecreeProto };

export interface Decree extends Omit<DecreeShared, 'collections'> {
  collections?: Referendum[];
  userPermissions?: DecreeUserPermissions;
}

export interface DecreeGroup {
  domainOfInfluenceType: DomainOfInfluenceType;
  decrees: Decree[];
}

export interface DecreeUserPermissions {
  canCreateReferendum: boolean;
  hasMaximumReferendumsBeenReached: boolean;
}

export function mapDecreeToModel(decreeProto: DecreeProto, includeCollections: boolean = true): Decree {
  const collections = includeCollections ? decreeProto.collections?.map(x => mapReferendumToModel(x)) : [];
  return {
    ...decreeProto.toObject(),
    collectionStartDate: decreeProto.collectionStartDate?.toDate(),
    collectionEndDate: decreeProto.collectionEndDate?.toDate(),
    collections: collections,
  } as Decree;
}

export function mapDecreeGroupToModel(proto: DecreeGroupProto): DecreeGroup {
  return {
    ...proto.toObject(),
    decrees: proto.decrees?.map(x => mapDecreeToModel(x)) ?? [],
  };
}
