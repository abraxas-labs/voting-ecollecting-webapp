/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  ListMyReferendumsResponse as ListMyReferendumsResponseProto,
  Referendum as ReferendumProto,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { Referendum as ReferendumShared, SimpleDecree as SimpleDecreeShared } from 'ecollecting-lib';
import { Collection, mapCollectionToModel } from './collection.model';
import { Decree, mapDecreeToModel } from './decree.model';
import { CollectionCameNotAboutReason, CollectionPeriodState } from '@abraxas/voting-ecollecting-proto';

export { ReferendumProto };

export interface Referendum extends Omit<ReferendumShared, 'collection' | 'decree'> {
  collection: Collection;
  isOtherReferendumOfSameDecreeSigned?: boolean;
  decree?: SimpleDecree;
}

export interface ListMyReferendumsResponse extends Omit<ListMyReferendumsResponseProto, 'decrees' | 'withoutDecreeReferendums'> {
  decrees: Decree[];
  withoutDecreeReferendums: Referendum[];
}

export interface SimpleDecree extends SimpleDecreeShared {
  cameNotAboutReason?: CollectionCameNotAboutReason;
  periodState?: CollectionPeriodState;
}

export function mapToListMyReferendumsResponse(response: ListMyReferendumsResponseProto): ListMyReferendumsResponse {
  return {
    decrees: response.decrees?.map(x => mapDecreeToModel(x)) ?? [],
    withoutDecreeReferendums: response.withoutDecreeReferendums?.map(x => mapReferendumToModel(x)) ?? [],
  } as ListMyReferendumsResponse;
}

export function mapReferendumToModel(referendumProto: ReferendumProto): Referendum {
  const collection = mapCollectionToModel(referendumProto.collection!);
  return {
    ...referendumProto.toObject(),
    collection: collection,
  } as Referendum;
}
