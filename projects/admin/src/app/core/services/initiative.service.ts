/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import {
  Initiative,
  InitiativeCommittee,
  InitiativeGroup,
  mapInitiativeCommittee,
  mapInitiativeGroupToModel,
  mapInitiativeSubTypeToModel,
  mapInitiativeToModel,
  mapVerifyInitiativeCommitteeMemberResponse,
  VerifyInitiativeCommitteeMemberResponse,
} from '../models/initiative.model';

import {
  AdmissibilityDecisionState,
  ApproveCommitteeMemberRequest,
  CameAboutInitiativeRequest,
  CameNotAboutInitiativeRequest,
  CreateInitiativeWithAdmissibilityDecisionRequest,
  CreateLinkedAdmissibilityDecisionRequest,
  DeleteAdmissibilityDecisionRequest,
  DeleteInitiativeRequest,
  EnableInitiativeRequest,
  FinishCorrectionInitiativeRequest,
  GetInitiativeCommitteeRequest,
  GetInitiativeRequest,
  InitiativeServiceClient,
  ListAdmissibilityDecisionsRequest,
  ListEligibleForAdmissibilityDecisionRequest,
  ListInitiativesRequest,
  PrepareDeleteInitiativeRequest,
  RejectCommitteeMemberRequest,
  ResetCommitteeMemberRequest,
  ReturnInitiativeForCorrectionRequest,
  SecondFactorTransaction,
  SetCollectionPeriodInitiativeRequest,
  SetInitiativeSensitiveDataExpiryDateRequest,
  UpdateAdmissibilityDecisionRequest,
  UpdateInitiativeRequest,
  VerifyCommitteeMemberRequest,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom, Observable } from 'rxjs';
import { Timestamp } from '@ngx-grpc/well-known-types';
import { downloadBlob, InitiativeLockedFields, InitiativeSubType, openBlobInNewTab, toProtoDate } from 'ecollecting-lib';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CollectionCameNotAboutReason, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Injectable({
  providedIn: 'root',
})
export class InitiativeService {
  private readonly client = inject(InitiativeServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/initiatives`;
  }

  public async listSubTypes(): Promise<InitiativeSubType[]> {
    const resp = await lastValueFrom(this.client.listSubTypes(new ListAdmissibilityDecisionsRequest()));
    return resp.subTypes!.map(s => mapInitiativeSubTypeToModel(s));
  }

  public async list(doiTypes?: DomainOfInfluenceType[], bfs?: string): Promise<InitiativeGroup[]> {
    const req = new ListInitiativesRequest();
    if (doiTypes !== undefined) {
      req.types = doiTypes;
    }

    if (bfs !== undefined) {
      req.bfs = bfs;
    }

    const resp = await lastValueFrom(this.client.list(req));
    return resp.groups!.map(g => mapInitiativeGroupToModel(g));
  }

  public async get(id: string): Promise<Initiative> {
    const resp = await lastValueFrom(this.client.get(new GetInitiativeRequest({ id })));
    return mapInitiativeToModel(resp);
  }

  public async finishCorrection(id: string): Promise<void> {
    await lastValueFrom(this.client.finishCorrection(new FinishCorrectionInitiativeRequest({ id })));
  }

  public async update(req: UpdateInitiativeRequest.AsObject): Promise<void> {
    // remove address if all fields are empty
    if (
      req.address !== undefined &&
      !req.address.locality &&
      !req.address.committeeOrPerson &&
      !req.address.zipCode &&
      !req.address.streetOrPostOfficeBox
    ) {
      delete req.address;
    }

    await lastValueFrom(this.client.update(new UpdateInitiativeRequest(req)));
  }

  public async setCollectionPeriod(id: string, collectionStartDate: Date, collectionEndDate: Date): Promise<void> {
    await lastValueFrom(
      this.client.setCollectionPeriod(
        new SetCollectionPeriodInitiativeRequest({
          id,
          collectionStartDate: Timestamp.fromDate(collectionStartDate),
          collectionEndDate: Timestamp.fromDate(collectionEndDate),
        }),
      ),
    );
  }

  public async enable(id: string, collectionStartDate?: Date, collectionEndDate?: Date): Promise<void> {
    await lastValueFrom(
      this.client.enable(
        new EnableInitiativeRequest({
          id,
          collectionStartDate: collectionStartDate ? Timestamp.fromDate(collectionStartDate) : undefined,
          collectionEndDate: collectionEndDate ? Timestamp.fromDate(collectionEndDate) : undefined,
        }),
      ),
    );
  }

  public async getCommittee(initiativeId: string): Promise<InitiativeCommittee> {
    const response = await lastValueFrom(this.client.getCommittee(new GetInitiativeCommitteeRequest({ id: initiativeId })));
    return mapInitiativeCommittee(response);
  }

  public async downloadCommitteeList(initiativeId: string, fileId: string): Promise<void> {
    const url = `${this.restApiUrl}/${initiativeId}/committee-lists/${fileId}`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public async resetCommitteeMember(initiativeId: string, id: string): Promise<void> {
    await lastValueFrom(
      this.client.resetCommitteeMember(
        new ResetCommitteeMemberRequest({
          id,
          initiativeId,
        }),
      ),
    );
  }

  public async verifyCommitteeMember(initiativeId: string, id: string): Promise<VerifyInitiativeCommitteeMemberResponse> {
    const resp = await lastValueFrom(
      this.client.verifyCommitteeMember(
        new VerifyCommitteeMemberRequest({
          id,
          initiativeId,
        }),
      ),
    );

    return mapVerifyInitiativeCommitteeMemberResponse(resp);
  }

  public async approveCommitteeMember(initiativeId: string, id: string): Promise<void> {
    await lastValueFrom(this.client.approveCommitteeMember(new ApproveCommitteeMemberRequest({ id, initiativeId })));
  }

  public async rejectCommitteeMember(initiativeId: string, id: string): Promise<void> {
    await lastValueFrom(this.client.rejectCommitteeMember(new RejectCommitteeMemberRequest({ id, initiativeId })));
  }

  public async listEligibleForAdmissibilityDecision(): Promise<Initiative[]> {
    const resp = await lastValueFrom(this.client.listEligibleForAdmissibilityDecision(new ListEligibleForAdmissibilityDecisionRequest()));
    return resp.initiatives!.map(i => mapInitiativeToModel(i));
  }

  public async listAdmissibilityDecisions(): Promise<Initiative[]> {
    const resp = await lastValueFrom(this.client.listAdmissibilityDecisions(new ListAdmissibilityDecisionsRequest()));
    return resp.initiatives!.map(i => mapInitiativeToModel(i));
  }

  public async deleteAdmissibilityDecisions(id: string): Promise<void> {
    await lastValueFrom(this.client.deleteAdmissibilityDecision(new DeleteAdmissibilityDecisionRequest({ id })));
  }

  public async createLinkedAdmissibilityDecision(
    initiativeId: string,
    state: AdmissibilityDecisionState,
    governmentDecisionNumber: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.createLinkedAdmissibilityDecision(
        new CreateLinkedAdmissibilityDecisionRequest({
          initiativeId,
          admissibilityDecisionState: state,
          governmentDecisionNumber,
        }),
      ),
    );
  }

  public async createWithAdmissibilityDecision(req: CreateInitiativeWithAdmissibilityDecisionRequest.AsObject): Promise<string> {
    // remove address if all fields are empty
    if (
      req.address !== undefined &&
      !req.address.locality &&
      !req.address.committeeOrPerson &&
      !req.address.zipCode &&
      !req.address.streetOrPostOfficeBox
    ) {
      delete req.address;
    }

    const resp = await lastValueFrom(
      this.client.createWithAdmissibilityDecision(new CreateInitiativeWithAdmissibilityDecisionRequest(req)),
    );
    return resp.id;
  }

  public async updateAdmissibilityDecision(
    initiativeId: string,
    admissibilityDecisionState: AdmissibilityDecisionState,
    governmentDecisionNumber: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.updateAdmissibilityDecision(
        new UpdateAdmissibilityDecisionRequest({
          initiativeId,
          admissibilityDecisionState,
          governmentDecisionNumber,
        }),
      ),
    );
  }

  public async cameAbout(id: string, sensitiveDataExpiryDate: Date): Promise<void> {
    await lastValueFrom(
      this.client.cameAbout(
        new CameAboutInitiativeRequest({ initiativeId: id, sensitiveDataExpiryDate: toProtoDate(sensitiveDataExpiryDate) }),
      ),
    );
  }

  public async cameNotAbout(id: string, sensitiveDataExpiryDate: Date, reason: CollectionCameNotAboutReason): Promise<void> {
    await lastValueFrom(
      this.client.cameNotAbout(
        new CameNotAboutInitiativeRequest({
          initiativeId: id,
          sensitiveDataExpiryDate: toProtoDate(sensitiveDataExpiryDate),
          reason,
        }),
      ),
    );
  }

  public async downloadDocuments(initiativeId: string): Promise<void> {
    const url = `${this.restApiUrl}/${initiativeId}/documents`;
    const blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
    downloadBlob('export.zip', blob);
  }

  public async setSensitiveDataExpiryDate(initiativeId: string, sensitiveDataExpiryDate: Date): Promise<void> {
    await lastValueFrom(
      this.client.setSensitiveDataExpiryDate(
        new SetInitiativeSensitiveDataExpiryDateRequest({
          initiativeId,
          sensitiveDataExpiryDate: toProtoDate(sensitiveDataExpiryDate),
        }),
      ),
    );
  }

  public async prepareDelete(initiativeId: string): Promise<SecondFactorTransaction.AsObject> {
    const resp = await lastValueFrom(this.client.prepareDelete(new PrepareDeleteInitiativeRequest({ initiativeId })));
    return resp.toObject();
  }

  public delete(initiativeId: string, secondFactorTransactionId: string): Observable<any> {
    return this.client.delete(new DeleteInitiativeRequest({ initiativeId, secondFactorTransactionId }));
  }

  public async returnForCorrection(id: string, lockedFields?: InitiativeLockedFields): Promise<void> {
    await lastValueFrom(
      this.client.returnForCorrection(
        new ReturnInitiativeForCorrectionRequest({
          id,
          lockedFields,
        }),
      ),
    );
  }
}
