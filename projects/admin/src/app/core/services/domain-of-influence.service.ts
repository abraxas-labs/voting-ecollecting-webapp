/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import {
  DomainOfInfluenceServiceClient,
  GetDomainOfInfluenceRequest,
  ListDomainOfInfluenceOwnTypesRequest,
  ListDomainOfInfluencesRequest,
  PrepareUpdateDomainOfInfluenceCollectionSettingsRequest,
  RemoveDomainOfInfluenceLogoRequest,
  SecondFactorAuthorization,
  UpdateDomainOfInfluenceRequest as UpdateDomainOfInfluenceRequestProto,
  UpdateDomainOfInfluenceCollectionSettings as UpdateDomainOfInfluenceCollectionSettingsProto,
  UpdateDomainOfInfluenceCollectionSettingsRequest,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom, Observable } from 'rxjs';
import { BoolValue } from '@ngx-grpc/well-known-types';
import { DomainOfInfluence, mapToDomainOfInfluence } from '../models/domain-of-influence.model';
import { mapToSecondFactorTransaction, SecondFactorTransaction } from '../models/second-factor.model';
import { switchMap } from 'rxjs/operators';
import { SafeResourceUrl } from '@angular/platform-browser';
import { newObjectUrlObservableForBlob } from 'ecollecting-lib';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type UpdateDomainOfInfluenceRequest = UpdateDomainOfInfluenceRequestProto.AsObject;
export type DomainOfInfluenceCollectionSettings = UpdateDomainOfInfluenceCollectionSettingsProto.AsObject;

@Injectable({
  providedIn: 'root',
})
export class DomainOfInfluenceService {
  private readonly client = inject(DomainOfInfluenceServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string = `${environment.restApiEndpoint}/domain-of-influences`;

  public async list(
    eCollectingEnabled?: boolean,
    doiTypes?: DomainOfInfluenceType[],
    includeChildren?: boolean,
  ): Promise<DomainOfInfluence[]> {
    const req = new ListDomainOfInfluencesRequest({ includeChildren: includeChildren ?? true });

    if (eCollectingEnabled !== undefined) {
      req.eCollectingEnabled = new BoolValue({ value: eCollectingEnabled });
    }

    if (doiTypes !== undefined) {
      req.types = doiTypes;
    }

    const resp = await lastValueFrom(this.client.list(req));
    return resp.domainOfInfluences?.map(x => mapToDomainOfInfluence(x)) ?? [];
  }

  public async listOwnTypes(): Promise<DomainOfInfluenceType[]> {
    const resp = await lastValueFrom(this.client.listOwnTypes(new ListDomainOfInfluenceOwnTypesRequest()));
    return resp.domainOfInfluenceTypes;
  }

  public async get(bfs: string): Promise<DomainOfInfluence> {
    const resp = await lastValueFrom(this.client.get(new GetDomainOfInfluenceRequest({ bfs })));
    return mapToDomainOfInfluence(resp);
  }

  public async update(updateReq: UpdateDomainOfInfluenceRequestProto.AsObject): Promise<void> {
    await lastValueFrom(this.client.update(new UpdateDomainOfInfluenceRequestProto(updateReq)));
  }

  public async prepareUpdateCollectionSettings(
    bfs: string,
    settings: DomainOfInfluenceCollectionSettings,
  ): Promise<SecondFactorTransaction> {
    const resp = await lastValueFrom(
      this.client.prepareUpdateCollectionSettings(
        new PrepareUpdateDomainOfInfluenceCollectionSettingsRequest({
          bfs,
          settings: new UpdateDomainOfInfluenceCollectionSettingsProto(settings),
        }),
      ),
    );
    return mapToSecondFactorTransaction(resp);
  }

  public updateCollectionSettings(
    bfs: string,
    settings: DomainOfInfluenceCollectionSettings,
    secondFactorTransactionId: string,
    otpCode?: string,
  ): Observable<any> {
    return this.client.updateCollectionSettings(
      new UpdateDomainOfInfluenceCollectionSettingsRequest({
        bfs,
        settings: new UpdateDomainOfInfluenceCollectionSettingsProto(settings),
        secondFactorAuthorization: new SecondFactorAuthorization({ secondFactorTransactionId, otpCode }),
      }),
    );
  }

  public async getLogo(bfs: string): Promise<Blob> {
    return lastValueFrom(this.http.get(`${this.restApiUrl}/${bfs}/logo`, { responseType: 'blob' }));
  }

  public async deleteLogo(bfs: string): Promise<void> {
    await lastValueFrom(this.client.removeLogo(new RemoveDomainOfInfluenceLogoRequest({ bfs })));
  }

  public async updateLogo(bfs: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('logo', file);
    await lastValueFrom(this.http.post(`${this.restApiUrl}/${bfs}/logo`, formData));
  }
}
