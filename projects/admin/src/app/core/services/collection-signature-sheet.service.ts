/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Injectable, inject } from '@angular/core';
import {
  AddSignatureSheetCitizenRequest,
  AddSignatureSheetRequest,
  AddSignatureSheetSamplesRequest,
  CollectionSignatureSheetServiceClient,
  CollectionSignatureSheetState,
  ConfirmSignatureSheetRequest,
  ConfirmSignatureSheetResponse,
  DeleteSignatureSheetRequest,
  DiscardSignatureSheetRequest,
  DiscardSignatureSheetResponse,
  GetSignatureSheetRequest,
  ListSignatureSheetCitizensRequest,
  ListSignatureSheetSamplesRequest,
  ListSignatureSheetsAttestedAtRequest,
  ListSignatureSheetsRequest,
  ListSignatureSheetsSort,
  RemoveSignatureSheetCitizenRequest,
  ReserveSignatureSheetNumberRequest,
  RestoreSignatureSheetRequest,
  RestoreSignatureSheetResponse,
  SearchSignatureSheetPersonCandidatesRequest,
  SubmitSignatureSheetRequest,
  SubmitSignatureSheetResponse,
  TryReleaseSignatureSheetNumberRequest,
  UnsubmitSignatureSheetRequest,
  UnsubmitSignatureSheetResponse,
  UpdateSignatureSheetRequest,
} from '@abraxas/voting-ecollecting-proto/admin';
import { lastValueFrom, map, Observable } from 'rxjs';
import { mapToPage, openBlobInNewTab, Page, Pageable, toProtoDate } from 'ecollecting-lib';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CollectionSignatureSheet,
  CollectionSignatureSheetCandidate,
  CollectionSignatureSheetNumberInfo,
  mapToCollectionSignatureSheet,
  mapToCollectionSignatureSheetCandidates,
  mapToCollectionSignatureSheets,
} from '../models/collection.model';
import { CollectionType, SortDirection } from '@abraxas/voting-ecollecting-proto';
import { Timestamp } from '@ngx-grpc/well-known-types';
import { mapToPerson, Person, PersonFilterData } from '../models/person.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionSignatureSheetService {
  private readonly client = inject(CollectionSignatureSheetServiceClient);
  private readonly http = inject(HttpClient);

  private readonly restApiUrl: string;

  constructor() {
    this.restApiUrl = `${environment.restApiEndpoint}/collections`;
  }

  public async list(
    collectionId: string,
    states: CollectionSignatureSheetState[],
    attestedAts: Date[] = [],
    sort: ListSignatureSheetsSort = ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_NUMBER,
    sortDirection: SortDirection = SortDirection.SORT_DIRECTION_ASCENDING,
    pageable?: Pageable,
  ): Promise<Page<CollectionSignatureSheet>> {
    const req = new ListSignatureSheetsRequest({
      collectionId,
      states,
      pageable,
      sort,
      sortDirection,
      attestedAts: attestedAts?.map(x => Timestamp.fromDate(x)),
    });
    const resp = await lastValueFrom(this.client.list(req));
    return mapToPage(resp.pageInfo!.toObject(), mapToCollectionSignatureSheets(resp.signatureSheets));
  }

  public async get(collectionId: string, signatureSheetId: string): Promise<any> {
    const req = new GetSignatureSheetRequest({ collectionId, signatureSheetId });
    const resp = await lastValueFrom(this.client.get(req));
    return mapToCollectionSignatureSheet(resp);
  }

  public async listAttestedAt(collectionId: string): Promise<Date[]> {
    const resp = await lastValueFrom(this.client.listAttestedAt(new ListSignatureSheetsAttestedAtRequest({ collectionId })));
    return resp.attestedAts!.map(a => a.toDate());
  }

  public async delete(collectionId: string, signatureSheetId: string): Promise<void> {
    await lastValueFrom(this.client.delete(new DeleteSignatureSheetRequest({ collectionId, signatureSheetId })));
  }

  public async reserveNumber(collectionId: string): Promise<CollectionSignatureSheetNumberInfo> {
    const resp = await lastValueFrom(this.client.reserveNumber(new ReserveSignatureSheetNumberRequest({ collectionId })));
    return resp.toObject();
  }

  public async tryReleaseNumber(collectionId: string, number: number): Promise<void> {
    await lastValueFrom(this.client.tryReleaseNumber(new TryReleaseSignatureSheetNumberRequest({ collectionId, number })));
  }

  public async add(collectionId: string, number: number, date: Date, signatureCountTotal: number): Promise<string> {
    const resp = await lastValueFrom(
      this.client.add(
        new AddSignatureSheetRequest({
          collectionId,
          number,
          receivedAt: toProtoDate(date),
          signatureCountTotal,
        }),
      ),
    );

    return resp.id;
  }

  public async update(collectionId: string, signatureSheetId: string, date: Date, signatureCountTotal: number): Promise<void> {
    await lastValueFrom(
      this.client.update(
        new UpdateSignatureSheetRequest({
          collectionId,
          signatureSheetId,
          receivedAt: toProtoDate(date),
          signatureCountTotal,
        }),
      ),
    );
  }

  public async attest(collectionId: string, signatureSheetIds: string[]): Promise<void> {
    const url = `${this.restApiUrl}/${collectionId}/signature-sheets/attest`;
    const blob = await lastValueFrom(this.http.post(url, signatureSheetIds, { responseType: 'blob' }));
    openBlobInNewTab(blob);
  }

  public searchPersonCandidates(
    collectionType: CollectionType,
    collectionId: string,
    signatureSheetId: string,
    filter: PersonFilterData,
    pageable?: Pageable,
  ): Observable<Page<CollectionSignatureSheetCandidate>> {
    const req = new SearchSignatureSheetPersonCandidatesRequest({
      collectionType,
      collectionId,
      signatureSheetId,
      ...filter,
      dateOfBirth: filter.dateOfBirth === undefined ? undefined : Timestamp.fromDate(filter.dateOfBirth),
      pageable,
    });
    return this.client
      .searchPersonCandidates(req)
      .pipe(map(x => mapToPage(x.pageInfo!.toObject(), mapToCollectionSignatureSheetCandidates(x.candidates!))));
  }

  public async addCitizen(
    collectionType: CollectionType,
    collectionId: string,
    signatureSheetId: string,
    personRegisterId: string,
  ): Promise<void> {
    const req = new AddSignatureSheetCitizenRequest({
      collectionType,
      collectionId,
      signatureSheetId,
      personRegisterId,
    });
    await lastValueFrom(this.client.addCitizen(req));
  }

  public async removeCitizen(collectionId: string, signatureSheetId: string, personRegisterId: string): Promise<void> {
    const req = new RemoveSignatureSheetCitizenRequest({
      collectionId,
      signatureSheetId,
      personRegisterId,
    });
    await lastValueFrom(this.client.removeCitizen(req));
  }

  public async listCitizens(collectionId: string, signatureSheetId: string): Promise<Person[]> {
    const req = new ListSignatureSheetCitizensRequest({ collectionId, signatureSheetId });
    const resp = await lastValueFrom(this.client.listCitizens(req));
    return resp.citizens!.map(p => mapToPerson(p));
  }

  public async submit(collectionId: string, signatureSheetId: string): Promise<SubmitSignatureSheetResponse.AsObject> {
    const resp = await lastValueFrom(this.client.submit(new SubmitSignatureSheetRequest({ collectionId, signatureSheetId })));
    return resp.toObject();
  }

  public async unsubmit(collectionId: string, signatureSheetId: string): Promise<UnsubmitSignatureSheetResponse.AsObject> {
    const resp = await lastValueFrom(this.client.unsubmit(new UnsubmitSignatureSheetRequest({ collectionId, signatureSheetId })));
    return resp.toObject();
  }

  public async discard(collectionId: string, signatureSheetId: string): Promise<DiscardSignatureSheetResponse.AsObject> {
    const resp = await lastValueFrom(this.client.discard(new DiscardSignatureSheetRequest({ collectionId, signatureSheetId })));
    return resp.toObject();
  }

  public async restore(collectionId: string, signatureSheetId: string): Promise<RestoreSignatureSheetResponse.AsObject> {
    const resp = await lastValueFrom(this.client.restore(new RestoreSignatureSheetRequest({ collectionId, signatureSheetId })));
    return resp.toObject();
  }

  public async confirm(request: ConfirmSignatureSheetRequest.AsObject): Promise<ConfirmSignatureSheetResponse.AsObject> {
    const resp = await lastValueFrom(this.client.confirm(new ConfirmSignatureSheetRequest(request)));
    return resp.toObject();
  }

  public async listSamples(collectionId: string): Promise<CollectionSignatureSheet[]> {
    const resp = await lastValueFrom(this.client.listSamples(new ListSignatureSheetSamplesRequest({ collectionId })));
    return mapToCollectionSignatureSheets(resp.signatureSheets);
  }

  public async addSamples(collectionId: string, signatureSheetsCount: number): Promise<CollectionSignatureSheet[]> {
    const resp = await lastValueFrom(this.client.addSamples(new AddSignatureSheetSamplesRequest({ collectionId, signatureSheetsCount })));
    return mapToCollectionSignatureSheets(resp.signatureSheets);
  }
}
