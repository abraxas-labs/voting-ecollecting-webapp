/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { lastValueFrom } from 'rxjs';
import {
  DomainOfInfluence as DomainOfInfluenceProto,
  DomainOfInfluenceServiceClient,
  ListDomainOfInfluencesRequest,
  ListDomainOfInfluencesResponse,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { BoolValue } from '@ngx-grpc/well-known-types';
import { DomainOfInfluence } from '../models/domain-of-influence.model';

@Injectable({
  providedIn: 'root',
})
export class DomainOfInfluenceService {
  private readonly client = inject(DomainOfInfluenceServiceClient);

  public async list(eCollectingEnabled?: boolean, doiTypes?: DomainOfInfluenceType[]): Promise<DomainOfInfluence[]> {
    const req = new ListDomainOfInfluencesRequest();

    if (eCollectingEnabled !== undefined) {
      req.eCollectingEnabled = new BoolValue({ value: eCollectingEnabled });
    }

    if (doiTypes !== undefined) {
      req.types = doiTypes;
    }

    const resp = await lastValueFrom(this.client.list(req));
    return this.mapDomainOfInfluencesFromResponse(resp);
  }

  public async listTypes(): Promise<DomainOfInfluenceType[]> {
    const resp = await lastValueFrom(this.client.listTypes(new ListDomainOfInfluencesRequest()));
    return resp.domainOfInfluenceTypes;
  }

  private mapDomainOfInfluencesFromResponse(response: ListDomainOfInfluencesResponse): DomainOfInfluence[] {
    return response.domainOfInfluences?.map(x => this.mapToDomainOfInfluence(x)) ?? [];
  }

  private mapToDomainOfInfluence(domainOfInfluence: DomainOfInfluenceProto): DomainOfInfluence {
    return {
      ...domainOfInfluence.toObject(),
    } as DomainOfInfluence;
  }
}
