/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Referendum as ReferendumProto, DecreeGroup as DecreeGroupProto } from '@abraxas/voting-ecollecting-proto/admin';
import { Referendum as ReferendumShared } from 'ecollecting-lib';
import { Decree, mapDecreeToModel } from './decree.model';
import { Collection, mapCollectionToModel } from './collection.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

export { ReferendumProto };

export interface DecreeGroup {
  domainOfInfluenceType: DomainOfInfluenceType;
  decrees: Decree[];
}

export interface Referendum extends Omit<ReferendumShared, 'collection'> {
  collection: Collection;
}

export function mapReferendumToModel(referendumProto: ReferendumProto): Referendum {
  const collection = mapCollectionToModel(referendumProto.collection!);
  return {
    ...referendumProto.toObject(),
    collection: collection,
  } as Referendum;
}

export function mapDecreeGroupToModel(proto: DecreeGroupProto): DecreeGroup {
  return {
    ...proto.toObject(),
    decrees: proto.decrees?.map(x => mapDecreeToModel(x)) ?? [],
  };
}
