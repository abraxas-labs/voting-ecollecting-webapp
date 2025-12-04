/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  CreateReferendumRequest,
  GetReferendumRequest,
  ListDecreesEligibleForReferendumRequest,
  ListMyReferendumsRequest,
  ReferendumServiceClient,
  SetReferendumInPreparationRequest,
  SignReferendumRequest,
  SubmitReferendumRequest,
  UpdateReferendumDecreeRequest,
  UpdateReferendumRequest,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { lastValueFrom } from 'rxjs';
import { ListMyReferendumsResponse, mapReferendumToModel, mapToListMyReferendumsResponse, Referendum } from '../models/referendum.model';
import { CollectionAddress, EntityGetter } from 'ecollecting-lib';
import { DecreeGroup, mapDecreeGroupToModel } from '../models/decree.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Injectable({
  providedIn: 'root',
})
export class ReferendumService implements EntityGetter<Referendum> {
  private readonly client = inject(ReferendumServiceClient);

  public async create(description: string, decreeId?: string): Promise<string> {
    const resp = await lastValueFrom(this.client.create(new CreateReferendumRequest({ description, decreeId })));
    return resp.id;
  }

  public async setInPreparation(referendumNumber: string): Promise<string> {
    const resp = await lastValueFrom(this.client.setInPreparation(new SetReferendumInPreparationRequest({ referendumNumber })));
    return resp.id;
  }

  public async get(id: string, includeIsSigned: boolean = false): Promise<Referendum> {
    const resp = await lastValueFrom(this.client.get(new GetReferendumRequest({ id, includeIsSigned })));
    return mapReferendumToModel(resp);
  }

  public async update(
    id: string,
    description: string,
    reason: string,
    address: CollectionAddress,
    membersCommittee: string,
    link: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.update(
        new UpdateReferendumRequest({
          id,
          description,
          reason,
          address,
          membersCommittee,
          link,
        }),
      ),
    );
  }

  public async submit(id: string): Promise<void> {
    await lastValueFrom(this.client.submit(new SubmitReferendumRequest({ id })));
  }

  public async listMy(): Promise<ListMyReferendumsResponse> {
    const resp = await lastValueFrom(this.client.listMy(new ListMyReferendumsRequest()));
    return mapToListMyReferendumsResponse(resp);
  }

  public async updateDecree(id: string, decreeId: string): Promise<void> {
    await lastValueFrom(this.client.updateDecree(new UpdateReferendumDecreeRequest({ id, decreeId })));
  }

  public async listDecreesEligibleForReferendum(
    includeReferendums: boolean,
    doiTypes?: DomainOfInfluenceType[],
    bfs?: string,
  ): Promise<DecreeGroup[]> {
    const req = new ListDecreesEligibleForReferendumRequest({ includeReferendums });
    if (doiTypes !== undefined) {
      req.types = doiTypes;
    }

    if (bfs !== undefined) {
      req.bfs = bfs;
    }

    const resp = await lastValueFrom(this.client.listDecreesEligibleForReferendum(req));
    return resp.groups?.map(g => mapDecreeGroupToModel(g)) ?? [];
  }

  public async sign(id: string): Promise<void> {
    await lastValueFrom(this.client.sign(new SignReferendumRequest({ id })));
  }
}
