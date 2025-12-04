/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  AcceptCollectionPermissionRequest,
  AddCollectionMessageRequest,
  CollectionServiceClient,
  CreateCollectionPermissionRequest,
  DeleteCollectionImageRequest,
  DeleteCollectionLogoRequest,
  DeleteCollectionPermissionRequest,
  DeleteSignatureSheetTemplateRequest,
  GenerateSignatureSheetTemplatePreviewRequest,
  GetPendingCollectionPermissionByTokenRequest,
  InitiativeServiceClient,
  ListCollectionMessagesRequest,
  ListCollectionPermissionsRequest,
  ListCollectionPermissionsResponse,
  ListCollectionsRequest,
  ListCollectionsResponse,
  ReferendumServiceClient,
  RejectCollectionPermissionRequest,
  ResendCollectionPermissionRequest,
  SetSignatureSheetTemplateGeneratedRequest,
  SignInitiativeRequest,
  SignReferendumRequest,
  UpdateRequestInformalReviewRequest,
  ValidateCollectionRequest,
  WithdrawCollectionRequest,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { lastValueFrom, Observable } from 'rxjs';
import { CollectionsGroup, mapCollectionsGroupToModel } from '../models/collections-group.model';
import { CollectionPeriodState, CollectionPermissionRole, CollectionType, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import {
  CollectionMessage,
  CollectionMessagesResponse,
  CollectionMessagesService,
  mapToCollectionMessage,
  mapToCollectionMessages,
  newObjectUrlObservableForBlob,
  openBlobInNewTab,
} from 'ecollecting-lib';
import { SafeResourceUrl } from '@angular/platform-browser';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CollectionPermission, PendingCollectionPermission } from '../models/collection.model';
import { mapValidationSummaryToModel, ValidationSummary } from '../models/validation.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionService implements CollectionMessagesService {
  private readonly client = inject(CollectionServiceClient);
  private readonly referendumClient = inject(ReferendumServiceClient);
  private readonly initiativeClient = inject(InitiativeServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/collections`;
  }

  public async list(periodState: CollectionPeriodState, doiTypes?: DomainOfInfluenceType[], bfs?: string): Promise<CollectionsGroup[]> {
    const req = new ListCollectionsRequest({ periodState });
    if (doiTypes !== undefined) {
      req.types = doiTypes;
    }

    if (bfs !== undefined) {
      req.bfs = bfs;
    }

    const resp = await lastValueFrom(this.client.list(req));
    return this.mapCollectionsFromResponse(resp);
  }

  public async listPermissions(collectionId: string): Promise<CollectionPermission[]> {
    const resp = await lastValueFrom(this.client.listPermissions(new ListCollectionPermissionsRequest({ collectionId })));
    return this.mapCollectionPermissionsFromResponse(resp);
  }

  public async getPendingPermissionByToken(token: string): Promise<PendingCollectionPermission> {
    const resp = await lastValueFrom(this.client.getPendingPermissionByToken(new GetPendingCollectionPermissionByTokenRequest({ token })));
    return resp.toObject() as PendingCollectionPermission;
  }

  public async acceptPermissionByToken(token: string): Promise<void> {
    await lastValueFrom(this.client.acceptPermissionByToken(new AcceptCollectionPermissionRequest({ token })));
  }

  public async rejectPermissionByToken(token: string): Promise<void> {
    await lastValueFrom(this.client.rejectPermissionByToken(new RejectCollectionPermissionRequest({ token })));
  }

  public async createPermission(
    collectionId: string,
    lastName: string,
    firstName: string,
    email: string,
    role: CollectionPermissionRole,
  ): Promise<string> {
    const resp = await lastValueFrom(
      this.client.createPermission(new CreateCollectionPermissionRequest({ collectionId, lastName, firstName, email, role })),
    );
    return resp.id;
  }

  public async deletePermission(id: string): Promise<void> {
    await lastValueFrom(this.client.deletePermission(new DeleteCollectionPermissionRequest({ id })));
  }

  public async resendPermission(id: string): Promise<void> {
    await lastValueFrom(this.client.resendPermission(new ResendCollectionPermissionRequest({ id })));
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

  public async deleteImage(collectionId: string): Promise<void> {
    await lastValueFrom(this.client.deleteImage(new DeleteCollectionImageRequest({ collectionId })));
  }

  public async deleteLogo(collectionId: string): Promise<void> {
    await lastValueFrom(this.client.deleteLogo(new DeleteCollectionLogoRequest({ collectionId })));
  }

  public async updateImage(collectionId: string, image: File): Promise<void> {
    const formData = new FormData();
    formData.append('image', image);
    await lastValueFrom(this.http.post(`${this.restApiUrl}/${collectionId}/image`, formData));
  }

  public async updateLogo(collectionId: string, logo: File): Promise<void> {
    const formData = new FormData();
    formData.append('logo', logo);
    await lastValueFrom(this.http.post(`${this.restApiUrl}/${collectionId}/logo`, formData));
  }

  public async setSignatureSheet(collectionId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await lastValueFrom(this.http.post(`${this.restApiUrl}/${collectionId}/signature-sheet-template`, formData));
  }

  public async deleteSignatureSheetTemplate(collectionId: string): Promise<void> {
    await lastValueFrom(this.client.deleteSignatureSheetTemplate(new DeleteSignatureSheetTemplateRequest({ id: collectionId })));
  }

  public async setSignatureSheetFileTemplateGenerated(collectionId: string, collectionType: CollectionType): Promise<void> {
    await lastValueFrom(
      this.client.setSignatureSheetTemplateGenerated(
        new SetSignatureSheetTemplateGeneratedRequest({ id: collectionId, collectionType: collectionType }),
      ),
    );
  }

  public async generateSignatureSheetTemplatePreview(collectionId: string, collectionType: CollectionType): Promise<void> {
    await lastValueFrom(
      this.client.generateSignatureSheetTemplatePreview(
        new GenerateSignatureSheetTemplatePreviewRequest({ id: collectionId, collectionType: collectionType }),
      ),
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

  public async downloadSignatureSheetTemplate(collectionId: string, preview: boolean): Promise<void> {
    let url = `${this.restApiUrl}/${collectionId}/signature-sheet-template`;
    if (preview) {
      url += '/preview';
    }

    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async downloadElectronicSignaturesProtocol(collectionId: string): Promise<void> {
    const url = `${this.restApiUrl}/${collectionId}/electronic-signatures-protocol`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async updateRequestInformalReview(collectionId: string, requestInformalReview: boolean): Promise<CollectionMessage> {
    const resp = await lastValueFrom(
      this.client.updateRequestInformalReview(new UpdateRequestInformalReviewRequest({ id: collectionId, requestInformalReview })),
    );
    return mapToCollectionMessage(resp);
  }

  public async withdraw(collectionId: string): Promise<void> {
    await lastValueFrom(this.client.withdraw(new WithdrawCollectionRequest({ id: collectionId })));
  }

  public async validate(collectionId: string): Promise<ValidationSummary> {
    const resp = await lastValueFrom(this.client.validate(new ValidateCollectionRequest({ id: collectionId })));
    return mapValidationSummaryToModel(resp);
  }

  public async sign(id: string, type: CollectionType): Promise<void> {
    switch (type) {
      case CollectionType.COLLECTION_TYPE_INITIATIVE:
        await lastValueFrom(this.initiativeClient.sign(new SignInitiativeRequest({ id })));
        break;
      case CollectionType.COLLECTION_TYPE_REFERENDUM:
        await lastValueFrom(this.referendumClient.sign(new SignReferendumRequest({ id })));
        break;
      default:
        throw new Error('unsupported collection type ' + type);
    }
  }

  private mapCollectionsFromResponse(listCollectionsResponse: ListCollectionsResponse): CollectionsGroup[] {
    return listCollectionsResponse.groups?.map(x => mapCollectionsGroupToModel(x)) ?? [];
  }

  private mapCollectionPermissionsFromResponse(response: ListCollectionPermissionsResponse): CollectionPermission[] {
    return response.permissions?.map(x => ({ ...x.toObject() }) as CollectionPermission) ?? [];
  }
}
