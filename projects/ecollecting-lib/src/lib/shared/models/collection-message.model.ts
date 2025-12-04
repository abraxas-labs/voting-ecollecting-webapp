/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionMessage as CollectionMessageProto, CollectionType } from '@abraxas/voting-ecollecting-proto';

export interface CollectionMessage {
  id: string;
  collectionId: string;
  collectionType: CollectionType;
  createdAt: Date;
  createdByName: string;
  content: string;
}

export interface CollectionMessagesResponse {
  messages: CollectionMessage[];
  informalReviewRequested: boolean;
}

export function mapToCollectionMessages(collections: CollectionMessageProto[] | undefined): CollectionMessage[] {
  return collections?.map(m => mapToCollectionMessage(m)) ?? [];
}

export function mapToCollectionMessage(collection: CollectionMessageProto): CollectionMessage {
  return {
    ...collection.toObject(),
    createdAt: collection.createdAt!.toDate(),
  };
}
