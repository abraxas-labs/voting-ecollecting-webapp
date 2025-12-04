/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionsGroup as CollectionsGroupProto } from '@abraxas/voting-ecollecting-proto/citizen';
import { CollectionsGroup as CollectionsGroupShared } from 'ecollecting-lib';
import { Decree, mapDecreeToModel } from './decree.model';
import { Initiative, mapInitiativeToModel } from './initiative.model';

export interface CollectionsGroup extends Omit<CollectionsGroupShared, 'referendums' | 'initiatives'> {
  referendums: Decree[];
  initiatives: Initiative[];
}

export function mapCollectionsGroupToModel(proto: CollectionsGroupProto): CollectionsGroup {
  return {
    ...proto.toObject(),
    referendums: proto.referendums?.map(x => mapDecreeToModel(x)) ?? [],
    initiatives: proto.initiatives?.map(x => mapInitiativeToModel(x)) ?? [],
  };
}
