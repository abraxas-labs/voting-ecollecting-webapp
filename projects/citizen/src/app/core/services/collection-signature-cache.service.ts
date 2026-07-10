/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable } from '@angular/core';
import { Collection, sha256, storage, storageKeyPrefix } from 'ecollecting-lib';
import { CollectionsGroup } from '../models/collections-group.model';
import { CollectionSignatureType } from '@abraxas/voting-ecollecting-proto/citizen';
import { GrpcMessage } from '@ngx-grpc/common';

const signaturesCacheStorageKeyPrefix = storageKeyPrefix + 'signatures-info-cache:';

interface SignatureCacheEntry {
  key: string;
  etag: string;

  /**
   * sha256(collectionId) => details
   */
  entries: Record<string, { isSigned: boolean; signatureType?: CollectionSignatureType }>;
}

@Injectable({
  providedIn: 'root',
})
export class CollectionSignatureCacheService {
  public get(req: GrpcMessage): SignatureCacheEntry {
    const key = this.getKey(req);
    try {
      const cacheItem = storage.getItem(key);
      if (!cacheItem) {
        return { key, etag: '', entries: {} };
      }

      return JSON.parse(cacheItem);
    } catch {
      return {
        key,
        etag: '',
        entries: {},
      };
    }
  }

  public async handleResponse(cache: SignatureCacheEntry, responseETag: string, responseGroups: CollectionsGroup[]): Promise<void> {
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
      cacheModified = await this.handleResponseGroupInitiatives(group, cache, cacheModified);
      cacheModified = await this.handleResponseGroupDecrees(group, cache, cacheModified);
    }

    if (cacheModified) {
      storage.setItem(cache.key, JSON.stringify(cache));
    }
  }

  private async handleResponseGroupInitiatives(group: CollectionsGroup, cache: SignatureCacheEntry, cacheModified: boolean) {
    for (const initiative of group.initiatives) {
      if (await this.handleResponseCollection(initiative.collection, cache)) {
        cacheModified = true;
      }
    }
    return cacheModified;
  }

  private async handleResponseGroupDecrees(group: CollectionsGroup, cache: SignatureCacheEntry, cacheModified: boolean) {
    for (const decree of group.referendums) {
      let isAnyReferendumSigned = false;

      for (const referendum of decree.collections ?? []) {
        if (await this.handleResponseCollection(referendum.collection, cache)) {
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

  private async handleResponseCollection(collection: Collection, cache: SignatureCacheEntry): Promise<boolean> {
    const idHash = await sha256(collection.id);

    // signature info provided by server, update cache
    if (collection.isSigned !== undefined) {
      cache.entries[idHash] = { isSigned: collection.isSigned, signatureType: collection.signatureType };
      return true;
    }

    // no signature info provided,
    // but available in cache, load from cache.
    if (idHash in cache.entries) {
      const entry = cache.entries[idHash];
      collection.isSigned = entry.isSigned;
      collection.signatureType = entry.signatureType;
    }

    return false;
  }

  private getKey(req: GrpcMessage): string {
    // store each request under a different key
    // there are only a handful of requests and we only store in session storage, so this should be fine.
    return signaturesCacheStorageKeyPrefix + btoa(String.fromCharCode(...req.serializeBinary()));
  }
}
