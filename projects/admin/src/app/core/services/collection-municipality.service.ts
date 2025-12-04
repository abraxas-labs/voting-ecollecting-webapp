/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  CollectionMunicipalityServiceClient,
  ListCollectionMunicipalitiesRequest,
  ListCollectionMunicipalitySignatureSheetsRequest,
  LockCollectionMunicipalityRequest,
  SubmitCollectionMunicipalitySignatureSheetsRequest,
  UnlockCollectionMunicipalityRequest,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom } from 'rxjs';
import {
  CollectionMunicipality,
  CollectionSignatureSheet,
  mapToCollectionSignatureSheets,
  mapToMunicipality,
  mapToSubmitCollectionMunicipalitySignatureSheetsResponse,
  SubmitCollectionMunicipalitySignatureSheetsResponse,
} from '../models/collection.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionMunicipalityService {
  private readonly client = inject(CollectionMunicipalityServiceClient);

  public async list(collectionId: string): Promise<CollectionMunicipality[]> {
    const resp = await lastValueFrom(this.client.list(new ListCollectionMunicipalitiesRequest({ collectionId })));
    return resp.municipalities!.map(x => mapToMunicipality(x));
  }

  public async unlock(collectionId: string, bfs: string): Promise<void> {
    await lastValueFrom(this.client.unlock(new UnlockCollectionMunicipalityRequest({ collectionId, bfs })));
  }

  public async lock(collectionId: string, bfs: string): Promise<void> {
    await lastValueFrom(this.client.lock(new LockCollectionMunicipalityRequest({ collectionId, bfs })));
  }

  public async submitSignatureSheets(collectionId: string, bfs: string): Promise<SubmitCollectionMunicipalitySignatureSheetsResponse> {
    const resp = await lastValueFrom(
      this.client.submitSignatureSheets(new SubmitCollectionMunicipalitySignatureSheetsRequest({ collectionId, bfs })),
    );
    return mapToSubmitCollectionMunicipalitySignatureSheetsResponse(resp);
  }

  public async listSignatureSheets(collectionId: string, bfs: string): Promise<CollectionSignatureSheet[]> {
    const resp = await lastValueFrom(
      this.client.listSignatureSheets(new ListCollectionMunicipalitySignatureSheetsRequest({ collectionId, bfs })),
    );
    return mapToCollectionSignatureSheets(resp.signatureSheets);
  }
}
