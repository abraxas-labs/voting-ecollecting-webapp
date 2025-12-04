/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionMessage, CollectionMessagesResponse } from '../shared/models/collection-message.model';
import { InjectionToken } from '@angular/core';

export const COLLECTION_MESSAGES_SERVICE_TOKEN = new InjectionToken<CollectionMessagesService>('CollectionMessagesService');

export interface CollectionMessagesService {
  listMessages(collectionId: string): Promise<CollectionMessagesResponse>;
  addMessage(collectionId: string, content: string): Promise<string>;
  updateRequestInformalReview(collectionId: string, informalReviewRequested: boolean): Promise<CollectionMessage>;
}
