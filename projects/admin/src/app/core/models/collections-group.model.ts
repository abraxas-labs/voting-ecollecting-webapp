/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionsGroup as CollectionsGroupProto } from '@abraxas/voting-ecollecting-proto/admin';
import { Decree, mapDecreeToModel } from './decree.model';
import { Initiative, mapInitiativeToModel } from './initiative.model';
import { CollectionType, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { Referendum } from './referendum.model';

export interface CollectionsGroup {
  domainOfInfluenceType: DomainOfInfluenceType;
  decrees: Decree[];
  initiatives: Initiative[];
}

export function mapCollectionsGroupToModel(proto: CollectionsGroupProto): CollectionsGroup {
  return {
    ...proto.toObject(),
    decrees: proto.decrees?.map(x => mapDecreeToModel(x)) ?? [],
    initiatives: proto.initiatives?.map(x => mapInitiativeToModel(x)) ?? [],
  };
}

export function isReferendum(obj?: Initiative | Referendum): obj is Referendum {
  return obj?.collection?.type === CollectionType.COLLECTION_TYPE_REFERENDUM;
}

export function isInitiative(obj?: Initiative | Referendum): obj is Initiative {
  return obj?.collection?.type === CollectionType.COLLECTION_TYPE_INITIATIVE;
}
