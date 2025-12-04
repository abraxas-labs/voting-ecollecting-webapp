/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  AcceptCommitteeMembershipRequest,
  AddCommitteeMemberRequest,
  CollectionFile,
  CreateInitiativeRequest,
  DeleteCommitteeListRequest,
  DeleteCommitteeMemberRequest,
  FlagInitiativeForReviewRequest,
  GetInitiativeCommitteeRequest,
  GetInitiativeRequest,
  GetPendingCommitteeMembershipByTokenRequest,
  InitiativeServiceClient,
  ListInitiativeSubTypesRequest,
  ListMyInitiativesRequest,
  RegisterInitiativeRequest,
  RejectCommitteeMembershipRequest,
  ResendCommitteeMemberInvitationRequest,
  SetInitiativeInPreparationRequest,
  SignInitiativeRequest,
  SubmitInitiativeRequest,
  UpdateCommitteeMemberRequest,
  UpdateCommitteeMemberSortRequest,
  UpdateInitiativeRequest,
} from '@abraxas/voting-ecollecting-proto/citizen';
import { lastValueFrom } from 'rxjs';
import { CollectionAddress, EntityGetter, InitiativeSubType, openBlobInNewTab } from 'ecollecting-lib';
import {
  Initiative,
  InitiativeCommittee,
  InitiativeCommitteeMember,
  mapInitiativeCommittee,
  mapInitiativeSubTypeToModel,
  mapInitiativeToModel,
  PendingInitiativeCommitteeMembership,
} from '../models/initiative.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Timestamp } from '@ngx-grpc/well-known-types';

@Injectable({
  providedIn: 'root',
})
export class InitiativeService implements EntityGetter<Initiative> {
  private readonly client = inject(InitiativeServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/initiatives`;
  }

  public async listMy(): Promise<Initiative[]> {
    const resp = await lastValueFrom(this.client.listMy(new ListMyInitiativesRequest()));
    return resp.initiatives?.map(i => mapInitiativeToModel(i)) ?? [];
  }

  public async listSubTypes(): Promise<InitiativeSubType[]> {
    const resp = await lastValueFrom(this.client.listSubTypes(new ListInitiativeSubTypesRequest()));
    return resp.subTypes!.map(s => mapInitiativeSubTypeToModel(s));
  }

  public async create(
    domainOfInfluenceType: DomainOfInfluenceType,
    description: string,
    subTypeId?: string,
    bfs?: string,
  ): Promise<string> {
    const resp = await lastValueFrom(
      this.client.create(
        new CreateInitiativeRequest({
          domainOfInfluenceType,
          description,
          subTypeId,
          bfs,
        }),
      ),
    );
    return resp.id;
  }

  public async setInPreparation(governmentDecisionNumber: string): Promise<string> {
    const resp = await lastValueFrom(
      this.client.setInPreparation(
        new SetInitiativeInPreparationRequest({
          governmentDecisionNumber,
        }),
      ),
    );
    return resp.id;
  }

  public async get(id: string, includeCommitteeDescription: boolean = false, includeIsSigned: boolean = false): Promise<Initiative> {
    const resp = await lastValueFrom(
      this.client.get(
        new GetInitiativeRequest({
          id,
          includeCommitteeDescription,
          includeIsSigned,
        }),
      ),
    );
    return mapInitiativeToModel(resp);
  }

  public async update(
    id: string,
    description: string,
    wording: string,
    reason: string,
    address: CollectionAddress,
    link: string,
    subTypeId?: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.update(
        new UpdateInitiativeRequest({
          id,
          description,
          wording,
          reason,
          address,
          link,
          subTypeId,
        }),
      ),
    );
  }

  public async getCommittee(initiativeId: string): Promise<InitiativeCommittee> {
    const response = await lastValueFrom(this.client.getCommittee(new GetInitiativeCommitteeRequest({ id: initiativeId })));
    return mapInitiativeCommittee(response);
  }

  public addCommitteeList(initiativeId: string, file: File): Promise<CollectionFile> {
    const formData = new FormData();
    formData.append('file', file);
    return lastValueFrom(this.http.post<CollectionFile>(`${this.restApiUrl}/${initiativeId}/committee-lists`, formData));
  }

  public async downloadCommitteeList(initiativeId: string, fileId: string): Promise<void> {
    const url = `${this.restApiUrl}/${initiativeId}/committee-lists/${fileId}`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async downloadCommitteeListTemplate(initiativeId: string): Promise<void> {
    const url = `${this.restApiUrl}/${initiativeId}/committee-lists/template`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async downloadCommitteeListTemplateByToken(initiativeId: string, token: string): Promise<void> {
    const url = `${this.restApiUrl}/${initiativeId}/committee-members/template`;
    const formData = new FormData();
    formData.append('token', token);
    const blob = await lastValueFrom(this.http.post(url, formData, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async deleteCommitteeList(initiativeId: string, id: string): Promise<void> {
    await lastValueFrom(this.client.deleteCommitteeList(new DeleteCommitteeListRequest({ id, initiativeId })));
  }

  public async addCommitteeMember(initiativeId: string, request: AddInitiativeCommitteeMemberRequest): Promise<string> {
    const resp = await lastValueFrom(
      this.client.addCommitteeMember(
        new AddCommitteeMemberRequest({
          initiativeId,
          ...request,
          dateOfBirth: Timestamp.fromDate(request.dateOfBirth),
        }),
      ),
    );
    return resp.id;
  }

  public async updateCommitteeMember(request: UpdateInitiativeCommitteeMemberRequest): Promise<void> {
    await lastValueFrom(
      this.client.updateCommitteeMember(
        new UpdateCommitteeMemberRequest({
          ...request,
          dateOfBirth: Timestamp.fromDate(request.dateOfBirth),
        }),
      ),
    );
  }

  public async resendCommitteeMemberInvitation(initiativeId: string, id: string): Promise<void> {
    await lastValueFrom(
      this.client.resendCommitteeMemberInvitation(
        new ResendCommitteeMemberInvitationRequest({
          id,
          initiativeId,
        }),
      ),
    );
  }

  public async deleteCommitteeMember(initiativeId: string, id: string): Promise<void> {
    await lastValueFrom(
      this.client.deleteCommitteeMember(
        new DeleteCommitteeMemberRequest({
          id,
          initiativeId,
        }),
      ),
    );
  }

  public async updateCommitteeMemberSort(initiativeId: string, id: string, newIndex: number): Promise<void> {
    await lastValueFrom(
      this.client.updateCommitteeMemberSort(
        new UpdateCommitteeMemberSortRequest({
          initiativeId,
          id,
          newIndex,
        }),
      ),
    );
  }

  public async submit(id: string): Promise<void> {
    await lastValueFrom(this.client.submit(new SubmitInitiativeRequest({ id })));
  }

  public async flagForReview(id: string): Promise<void> {
    await lastValueFrom(this.client.flagForReview(new FlagInitiativeForReviewRequest({ id })));
  }

  public async register(id: string): Promise<void> {
    await lastValueFrom(this.client.register(new RegisterInitiativeRequest({ id })));
  }

  public async getPendingCommitteeMembershipByToken(token: string): Promise<PendingInitiativeCommitteeMembership> {
    const resp = await lastValueFrom(
      this.client.getPendingCommitteeMembershipByToken(new GetPendingCommitteeMembershipByTokenRequest({ token })),
    );
    return resp.toObject() as PendingInitiativeCommitteeMembership;
  }

  public async acceptCommitteeMembershipByToken(token: string): Promise<boolean> {
    const resp = await lastValueFrom(this.client.acceptCommitteeMembershipByToken(new AcceptCommitteeMembershipRequest({ token })));
    return resp.accepted;
  }

  public async rejectCommitteeMembershipByToken(token: string): Promise<void> {
    await lastValueFrom(this.client.rejectCommitteeMembershipByToken(new RejectCommitteeMembershipRequest({ token })));
  }

  public async acceptCommitteeMembershipWithCommitteeList(initiativeId: string, token: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', file);
    await lastValueFrom(this.http.post(`${this.restApiUrl}/${initiativeId}/committee-members/accept`, formData));
  }

  public async sign(initiativeId: string): Promise<void> {
    await lastValueFrom(this.client.sign(new SignInitiativeRequest({ id: initiativeId })));
  }
}

export interface AddInitiativeCommitteeMemberRequest
  extends Omit<
    InitiativeCommitteeMember,
    'id' | 'approvalState' | 'signatureType' | 'memberSignatureRequested' | 'canEdit' | 'residence' | 'politicalResidence'
  > {
  requestMemberSignature: boolean;
}

export interface UpdateInitiativeCommitteeMemberRequest extends AddInitiativeCommitteeMemberRequest {
  initiativeId: string;
  id: string;
}
