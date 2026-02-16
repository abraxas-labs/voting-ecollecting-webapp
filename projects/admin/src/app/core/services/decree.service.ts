/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { Decree, mapDecreeToModel } from '../models/decree.model';
import {
  CameAboutDecreeRequest,
  CameNotAboutDecreeRequest,
  CreateDecreeRequest,
  CreateDecreeResponse,
  DecreeServiceClient,
  DeleteDecreeRequest,
  DeletePublishedDecreeRequest,
  ListDecreesRequest,
  PrepareDeleteDecreeRequest,
  SecondFactorTransaction,
  SetDecreeSensitiveDataExpiryDateRequest,
  UpdateDecreeRequest,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom, Observable } from 'rxjs';
import { CollectionCameNotAboutReason } from '@abraxas/voting-ecollecting-proto';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { downloadBlob, toProtoDate } from 'ecollecting-lib';

@Injectable({
  providedIn: 'root',
})
export class DecreeService {
  private readonly client = inject(DecreeServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/decrees`;
  }

  public async create(decree: Decree): Promise<CreateDecreeResponse.AsObject> {
    const resp = await lastValueFrom(
      this.client.create(
        new CreateDecreeRequest({
          ...decree,
          collectionStartDate: toProtoDate(decree.collectionStartDate!),
          collectionEndDate: toProtoDate(decree.collectionEndDate!),
        }),
      ),
    );
    return resp.toObject();
  }

  public async list(): Promise<Decree[]> {
    const resp = await lastValueFrom(this.client.list(new ListDecreesRequest()));
    return resp.decrees!.map(d => mapDecreeToModel(d));
  }

  public async update(decree: Decree): Promise<void> {
    await lastValueFrom(
      this.client.update(
        new UpdateDecreeRequest({
          ...decree,
          collectionStartDate: toProtoDate(decree.collectionStartDate!),
          collectionEndDate: toProtoDate(decree.collectionEndDate!),
        }),
      ),
    );
  }

  public async deletePublished(decree: Decree): Promise<void> {
    await lastValueFrom(
      this.client.deletePublished(
        new DeletePublishedDecreeRequest({
          ...decree,
        }),
      ),
    );
  }

  public async cameAbout(id: string, sensitiveDataExpiryDate: Date): Promise<void> {
    await lastValueFrom(
      this.client.cameAbout(new CameAboutDecreeRequest({ decreeId: id, sensitiveDataExpiryDate: toProtoDate(sensitiveDataExpiryDate) })),
    );
  }

  public async cameNotAbout(id: string, sensitiveDataExpiryDate: Date, reason: CollectionCameNotAboutReason): Promise<void> {
    await lastValueFrom(
      this.client.cameNotAbout(
        new CameNotAboutDecreeRequest({ decreeId: id, sensitiveDataExpiryDate: toProtoDate(sensitiveDataExpiryDate), reason }),
      ),
    );
  }

  public async downloadDocuments(decreeId: string): Promise<void> {
    const url = `${this.restApiUrl}/${decreeId}/documents`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    downloadBlob('export.zip', blob);
  }

  public async setSensitiveDataExpiryDate(decreeId: string, sensitiveDataExpiryDate: Date): Promise<void> {
    await lastValueFrom(
      this.client.setSensitiveDataExpiryDate(
        new SetDecreeSensitiveDataExpiryDateRequest({
          decreeId,
          sensitiveDataExpiryDate: toProtoDate(sensitiveDataExpiryDate),
        }),
      ),
    );
  }

  public async prepareDelete(decreeId: string): Promise<SecondFactorTransaction.AsObject> {
    const resp = await lastValueFrom(this.client.prepareDelete(new PrepareDeleteDecreeRequest({ decreeId })));
    return resp.toObject();
  }

  public delete(decreeId: string, secondFactorTransactionId: string): Observable<any> {
    return this.client.delete(new DeleteDecreeRequest({ decreeId, secondFactorTransactionId }));
  }
}
