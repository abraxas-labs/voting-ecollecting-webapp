/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  CreateReferendumRequest,
  GetReferendumRequest,
  ListReferendumDecreesRequest,
  ReferendumServiceClient,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom } from 'rxjs';
import { DecreeGroup, mapDecreeGroupToModel, mapReferendumToModel, Referendum } from '../models/referendum.model';
import { CollectionAddress, EntityGetter } from 'ecollecting-lib';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Injectable({
  providedIn: 'root',
})
export class ReferendumService implements EntityGetter<Referendum> {
  private readonly client = inject(ReferendumServiceClient);

  public async get(id: string): Promise<Referendum> {
    const resp = await lastValueFrom(this.client.get(new GetReferendumRequest({ id })));
    return mapReferendumToModel(resp);
  }

  public async listDecrees(doiTypes?: DomainOfInfluenceType[], bfs?: string): Promise<DecreeGroup[]> {
    const req = new ListReferendumDecreesRequest();
    if (doiTypes !== undefined) {
      req.types = doiTypes;
    }

    if (bfs !== undefined) {
      req.bfs = bfs;
    }

    const resp = await lastValueFrom(this.client.listDecrees(req));
    return resp.groups?.map(g => mapDecreeGroupToModel(g)) ?? [];
  }

  public async create(decreeId: string, description: string, address: CollectionAddress): Promise<string> {
    const resp = await lastValueFrom(this.client.create(new CreateReferendumRequest({ decreeId, description, address })));
    return resp.id;
  }
}
