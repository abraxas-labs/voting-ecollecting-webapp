/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  ListMyReferendumsResponse as ListMyReferendumsResponseProto,
  Referendum as ReferendumProto,
  SimpleDecree as SimpleDecreeProto,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { fromProtoDate, Referendum as ReferendumShared, SimpleDecree as SimpleDecreeShared } from 'ecollecting-lib';
import { Collection, mapCollectionToModel } from './collection.model';
import { Decree, mapDecreeToModel } from './decree.model';
import { CollectionCameNotAboutReason, CollectionPeriodState, CollectionType } from '@abraxas/voting-ecollecting-proto';
import { Initiative } from './initiative.model';

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
  collectionStartDate?: Date;
  collectionEndDate?: Date;
  signatureListSubmissionEndDate?: Date;
}

export function mapToListMyReferendumsResponse(response: ListMyReferendumsResponseProto): ListMyReferendumsResponse {
  return {
    decrees: response.decrees?.map(x => mapDecreeToModel(x)) ?? [],
    withoutDecreeReferendums: response.withoutDecreeReferendums?.map(x => mapReferendumToModel(x)) ?? [],
  } as ListMyReferendumsResponse;
}

export function mapReferendumToModel(referendumProto: ReferendumProto): Referendum {
  const collection = mapCollectionToModel(referendumProto.collection!);
  const decree = referendumProto.decree ? mapSimpleDecreeToModel(referendumProto.decree) : undefined;
  return {
    ...referendumProto.toObject(),
    collection: collection,
    decree: decree,
  } as Referendum;
}

export function mapSimpleDecreeToModel(simpleDecreeProto: SimpleDecreeProto): SimpleDecree {
  return {
    ...simpleDecreeProto.toObject(),
    collectionStartDate: fromProtoDate(simpleDecreeProto.collectionStartDate),
    collectionEndDate: fromProtoDate(simpleDecreeProto.collectionEndDate),
    signatureListSubmissionEndDate: fromProtoDate(simpleDecreeProto.signatureListSubmissionEndDate),
  } as SimpleDecree;
}

export function isReferendum(obj?: Initiative | Referendum): obj is Referendum {
  return obj?.collection?.type === CollectionType.COLLECTION_TYPE_REFERENDUM;
}
