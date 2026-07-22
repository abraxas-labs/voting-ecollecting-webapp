/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import { Collection } from 'ecollecting-lib';
import { CollectionsGroup } from '../models/collections-group.model';
import { CollectionSignatureType } from '@abraxas/voting-ecollecting-proto/citizen';
import { GrpcMessage } from '@ngx-grpc/common';

interface SignatureCacheEntry {
  key: string;
  etag: string;
  entries: Record<string, { isSigned: boolean; signatureType?: CollectionSignatureType }>;
}

@Injectable({
  providedIn: 'root',
})
export class CollectionSignatureCacheService {
  private readonly cache = new Map<string, SignatureCacheEntry>();

  public clear(): void {
    this.cache.clear();
  }

  public get(req: GrpcMessage): SignatureCacheEntry {
    const key = this.getKey(req);
    return this.cache.get(key) ?? { key, etag: '', entries: {} };
  }

  public handleResponse(cache: SignatureCacheEntry, responseETag: string, responseGroups: CollectionsGroup[]): void {
    // if the response has no etag, do not apply or rebuild the cache.
    // It is likely an unauthenticated request and therefore doesn't carry any signature info.
    if (!responseETag) {
      return;
    }

    let cacheModified = false;

    // etag not matching, rebuild the cache.
    if (cache.etag !== responseETag) {
      cacheModified = true;
      cache = { key: cache.key, etag: responseETag, entries: {} };
    }

    // always store any retrieved info in cache,
    // try to load missing info from cache.
    for (const group of responseGroups) {
      cacheModified = this.handleResponseGroupInitiatives(group, cache, cacheModified);
      cacheModified = this.handleResponseGroupDecrees(group, cache, cacheModified);
    }

    if (cacheModified) {
      this.cache.set(cache.key, cache);
    }
  }

  private handleResponseGroupInitiatives(group: CollectionsGroup, cache: SignatureCacheEntry, cacheModified: boolean) {
    for (const initiative of group.initiatives) {
      if (this.handleResponseCollection(initiative.collection, cache)) {
        cacheModified = true;
      }
    }
    return cacheModified;
  }

  private handleResponseGroupDecrees(group: CollectionsGroup, cache: SignatureCacheEntry, cacheModified: boolean) {
    for (const decree of group.referendums) {
      let isAnyReferendumSigned = false;

      for (const referendum of decree.collections ?? []) {
        if (this.handleResponseCollection(referendum.collection, cache)) {
          cacheModified = true;
        }

        if (referendum.collection.isSigned) {
          isAnyReferendumSigned = true;
        }
      }

      for (const referendum of decree.collections ?? []) {
        referendum.isOtherReferendumOfSameDecreeSigned = !referendum.collection.isSigned && isAnyReferendumSigned;
      }
    }
    return cacheModified;
  }

  private handleResponseCollection(collection: Collection, cache: SignatureCacheEntry): boolean {
    // signature info provided by server, update cache
    if (collection.isSigned !== undefined) {
      cache.entries[collection.id] = { isSigned: collection.isSigned, signatureType: collection.signatureType };
      return true;
    }

    // no signature info provided,
    // but available in cache, load from cache.
    if (collection.id in cache.entries) {
      const entry = cache.entries[collection.id];
      collection.isSigned = entry.isSigned;
      collection.signatureType = entry.signatureType;
    }

    return false;
  }

  private getKey(req: GrpcMessage): string {
    return btoa(String.fromCharCode(...req.serializeBinary()));
  }
}
