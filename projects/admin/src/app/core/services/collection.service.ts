/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  AddCollectionMessageRequest,
  CollectionControlSignFilter,
  CollectionServiceClient,
  DeleteCollectionImageRequest,
  DeleteCollectionLogoRequest,
  DeleteSignatureSheetTemplateRequest,
  DeleteWithdrawnCollectionRequest,
  FinishInformalReviewRequest,
  ListCollectionMessagesRequest,
  ListCollectionPermissionsRequest,
  ListCollectionsForDeletionRequest,
  SecondFactorTransaction,
  SetCommitteeAddressRequest,
  SubmitSignatureSheetsRequest,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom, Observable } from 'rxjs';
import {
  CollectionAddress,
  CollectionMessage,
  CollectionMessagesResponse,
  CollectionMessagesService,
  mapToCollectionMessage,
  mapToCollectionMessages,
  newObjectUrlObservableForBlob,
  openBlobInNewTab,
} from 'ecollecting-lib';
import { HttpClient } from '@angular/common/http';
import { SafeResourceUrl } from '@angular/platform-browser';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CollectionPermission,
  mapToCollectionPermissions,
  mapToSubmitSignatureSheetsResponse,
  SubmitSignatureSheetsResponse,
} from '../models/collection.model';
import { CollectionType, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { CollectionsGroup, mapCollectionsGroupToModel } from '../models/collections-group.model';
import { Timestamp } from '@ngx-grpc/well-known-types';

@Injectable({
  providedIn: 'root',
})
export class CollectionService implements CollectionMessagesService {
  private readonly client = inject(CollectionServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/collections`;
  }

  public async listMessages(collectionId: string): Promise<CollectionMessagesResponse> {
    const req = new ListCollectionMessagesRequest({ collectionId });
    const resp = await lastValueFrom(this.client.listMessages(req));
    return {
      messages: mapToCollectionMessages(resp.messages),
      informalReviewRequested: resp.informalReviewRequested,
    };
  }

  public async addMessage(collectionId: string, content: string): Promise<string> {
    const req = new AddCollectionMessageRequest({ collectionId, content });
    const resp = await lastValueFrom(this.client.addMessage(req));
    return resp.id;
  }

  public async updateRequestInformalReview(collectionId: string): Promise<CollectionMessage> {
    const resp = await lastValueFrom(this.client.finishInformalReview(new FinishInformalReviewRequest({ collectionId })));
    return mapToCollectionMessage(resp);
  }

  public async listForDeletion(
    filter: CollectionControlSignFilter,
    doiTypes: DomainOfInfluenceType[],
    bfs?: string,
  ): Promise<CollectionsGroup[]> {
    const req = new ListCollectionsForDeletionRequest({
      filter,
      types: doiTypes,
    });

    if (bfs !== undefined) {
      req.bfs = bfs;
    }

    const resp = await lastValueFrom(this.client.listForDeletion(req));
    return resp.groups!.map(g => mapCollectionsGroupToModel(g));
  }

  public async deleteWithdrawn(collectionId: string): Promise<void> {
    await lastValueFrom(this.client.deleteWithdrawn(new DeleteWithdrawnCollectionRequest({ collectionId })));
  }

  public async deleteImage(collectionId: string, collectionType: CollectionType): Promise<void> {
    await lastValueFrom(this.client.deleteImage(new DeleteCollectionImageRequest({ collectionId, collectionType })));
  }

  public async deleteLogo(collectionId: string, collectionType: CollectionType): Promise<void> {
    await lastValueFrom(this.client.deleteLogo(new DeleteCollectionLogoRequest({ collectionId, collectionType })));
  }

  public async deleteSignatureSheetTemplate(collectionId: string, collectionType: CollectionType): Promise<void> {
    await lastValueFrom(
      this.client.deleteSignatureSheetTemplate(new DeleteSignatureSheetTemplateRequest({ collectionId, collectionType })),
    );
  }

  public getLogo(collectionId: string): Observable<SafeResourceUrl> {
    return this.http
      .get(`${this.restApiUrl}/${collectionId}/logo`, { responseType: 'blob' })
      .pipe(switchMap(x => newObjectUrlObservableForBlob(x)));
  }

  public getImage(collectionId: string): Observable<SafeResourceUrl> {
    return this.http
      .get(`${this.restApiUrl}/${collectionId}/image`, { responseType: 'blob' })
      .pipe(switchMap(x => newObjectUrlObservableForBlob(x)));
  }

  public async downloadSignatureSheet(collectionId: string): Promise<void> {
    const url = `${this.restApiUrl}/${collectionId}/signature-sheet-template`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async listPermissions(collectionId: string): Promise<CollectionPermission[]> {
    const resp = await lastValueFrom(this.client.listPermissions(new ListCollectionPermissionsRequest({ collectionId })));
    return mapToCollectionPermissions(resp.permissions);
  }

  public async submitSignatureSheets(collectionId: string): Promise<SubmitSignatureSheetsResponse> {
    const resp = await lastValueFrom(this.client.submitSignatureSheets(new SubmitSignatureSheetsRequest({ collectionId })));
    return mapToSubmitSignatureSheetsResponse(resp);
  }

  public async setCommitteeAddress(collectionId: string, address: CollectionAddress): Promise<void> {
    await lastValueFrom(this.client.setCommitteeAddress(new SetCommitteeAddressRequest({ collectionId, address })));
  }
}
