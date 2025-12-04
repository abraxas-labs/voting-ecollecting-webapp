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
  RemoveDomainOfInfluenceLogoRequest,
  UpdateDomainOfInfluenceRequest as UpdateDomainOfInfluenceRequestProto,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom, Observable } from 'rxjs';
import { BoolValue } from '@ngx-grpc/well-known-types';
import { DomainOfInfluence, mapToDomainOfInfluence } from '../models/domain-of-influence.model';
import { switchMap } from 'rxjs/operators';
import { SafeResourceUrl } from '@angular/platform-browser';
import { newObjectUrlObservableForBlob } from 'ecollecting-lib';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type UpdateDomainOfInfluenceRequest = UpdateDomainOfInfluenceRequestProto.AsObject;

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

  public getLogo(bfs: string): Observable<SafeResourceUrl> {
    return this.http.get(`${this.restApiUrl}/${bfs}/logo`, { responseType: 'blob' }).pipe(switchMap(x => newObjectUrlObservableForBlob(x)));
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
