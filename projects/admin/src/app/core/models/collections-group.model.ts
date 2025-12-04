/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionsGroup as CollectionsGroupProto } from '@abraxas/voting-ecollecting-proto/admin';
import { Decree, mapDecreeToModel } from './decree.model';
import { Initiative, mapInitiativeToModel } from './initiative.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

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
