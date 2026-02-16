/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, inject, OnDestroy, ViewChild } from '@angular/core';
import {
  ButtonModule,
  DialogService,
  DividerModule,
  IconButtonModule,
  ReadonlyModule,
  SubNavigationBarModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Referendum } from '../../core/models/referendum.model';
import { Initiative } from '../../core/models/initiative.model';
import { CollectionSignatureSheet, CollectionSignatureSheetCandidate } from '../../core/models/collection.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { Person, PersonFilterData, PersonReviewState } from '../../core/models/person.model';
import { SignatureSheetHeaderComponent } from '../../signature-sheets/signature-sheet-detail/signature-sheet-header/signature-sheet-header.component';
import { SignatureSheetCitizenTableComponent } from '../../signature-sheets/signature-sheet-detail/signature-sheet-citizen-table/signature-sheet-citizen-table.component';
import { SignatureSheetPersonSearchComponent } from '../../signature-sheets/signature-sheet-detail/signature-sheet-person-search/signature-sheet-person-search.component';
import {
  ConfirmDialogService,
  createComparer,
  emptyPage,
  insertSorted,
  LoadingBarComponent,
  Page,
  Pageable,
  ToastService,
} from 'ecollecting-lib';
import { SignatureSheetCandidatesTableComponent } from '../../signature-sheets/signature-sheet-detail/signature-sheet-candidates-table/signature-sheet-candidates-table.component';
import { VotingLibModule } from '@abraxas/voting-lib';
import {
  CheckSamplesSignatureSheetConfirmDialogComponent,
  CheckSamplesSignatureSheetConfirmDialogData,
  CheckSamplesSignatureSheetConfirmDialogResult,
} from '../check-samples-signature-sheet-confirm-dialog/check-samples-signature-sheet-confirm-dialog.component';
import { cloneDeep, isEqual } from 'lodash';

@Component({
  selector: 'app-check-samples-signature-sheet-detail',
  templateUrl: './check-samples-signature-sheet-detail.component.html',
  styleUrls: ['./check-samples-signature-sheet-detail.component.scss'],
  imports: [
    ButtonModule,
    DecimalPipe,
    DividerModule,
    IconButtonModule,
    SubNavigationBarModule,
    TooltipModule,
    TranslatePipe,
    TruncateWithTooltipModule,
    SignatureSheetHeaderComponent,
    SignatureSheetCitizenTableComponent,
    SignatureSheetPersonSearchComponent,
    LoadingBarComponent,
    SignatureSheetCandidatesTableComponent,
    DatePipe,
    VotingLibModule,
    ReadonlyModule,
  ],
  providers: [DialogService],
})
export class CheckSamplesSignatureSheetDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);
  private readonly toast = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected collection?: Referendum | Initiative;
  protected sheet?: CollectionSignatureSheet;
  protected citizens: Person[] = [];
  protected loadingCitizens = true;
  protected personCandidatesPage: Page<CollectionSignatureSheetCandidate> = emptyPage<CollectionSignatureSheetCandidate>();

  private readonly personComparer = createComparer<Person>('officialName', 'firstName', 'dateOfBirth');
  private readonly routeSubscription: Subscription;
  private searchSubscription?: Subscription;
  private lastUsedFilter?: PersonFilterData;
  private addedPersonRegisterIds: string[] = [];
  private originalSheet?: CollectionSignatureSheet;
  private originalCitizens?: Person[];

  @ViewChild(SignatureSheetPersonSearchComponent)
  protected personSearchComponent?: SignatureSheetPersonSearchComponent;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection, sheet }) => this.loadData(collection, sheet));
  }

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    return !this.hasChanges;
  }

  protected get searching(): boolean {
    return this.searchSubscription?.closed === false;
  }

  protected get hasChanges(): boolean {
    return this.citizens.some(x => !!x.reviewState) || !isEqual(this.sheet, this.originalSheet);
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected async backWithUnsavedChangesCheck(): Promise<void> {
    if (await this.confirmResetChanges()) {
      return;
    }

    await this.back();
  }

  protected async save(): Promise<void> {
    if (!this.collection || !this.sheet || !this.collection.collection.attestedCollectionCount?.totalCitizenCount) {
      return;
    }

    const removedPersonRegisterIds = this.citizens.filter(x => x.reviewState === PersonReviewState.Removed).map(x => x.registerId);

    const dialogRef = this.dialogService.open(CheckSamplesSignatureSheetConfirmDialogComponent, {
      collectionId: this.collection.id,
      signatureSheetId: this.sheet.id,
      collectionType: this.collection.collection.type,
      addedPersonRegisterIds: this.addedPersonRegisterIds,
      removedPersonRegisterIds: removedPersonRegisterIds,
      signatureCountTotal: this.sheet.count.total,
    } satisfies CheckSamplesSignatureSheetConfirmDialogData);

    const result = (await firstValueFrom(dialogRef.afterClosed())) as CheckSamplesSignatureSheetConfirmDialogResult;
    if (!result) {
      return;
    }

    // update collection count since the collection isn't reloaded after back navigation
    this.collection.collection.attestedCollectionCount.totalCitizenCount += result.totalValidDifference;
    if (result.nextSignatureSheetId) {
      await this.router.navigate(['..', result.nextSignatureSheetId], { relativeTo: this.route });
    } else {
      await this.back();
    }
  }

  protected removeCitizen(citizen: Person): void {
    if (!this.collection || !this.sheet) {
      return;
    }

    // cannot simply delete candidate.existingSignature
    // otherwise the bc would just re-add the candidate by emitting the checked-changed event on the row.
    const candidateIdx = this.personCandidatesPage.items.findIndex(p => p.person.registerId === citizen.registerId);
    if (candidateIdx !== -1) {
      const candidate = { ...this.personCandidatesPage.items[candidateIdx] };
      delete candidate.existingSignature;
      this.personCandidatesPage.items[candidateIdx] = candidate;
      this.personCandidatesPage.items = [...this.personCandidatesPage.items];
    }

    this.sheet.count.valid--;
    this.sheet.count.invalid++;

    if (!citizen.reviewState) {
      citizen.reviewState = PersonReviewState.Removed;
      return;
    }

    this.citizens = this.citizens.filter(c => c.registerId !== citizen.registerId);
    this.addedPersonRegisterIds = this.addedPersonRegisterIds.filter(x => x !== citizen.registerId);
  }

  protected confirmCitizen(citizen: Person): void {
    citizen.reviewState = PersonReviewState.Confirmed;
  }

  protected revertCitizen(citizen: Person): void {
    if (!this.collection || !this.sheet) {
      return;
    }

    // if a citizen was confirmed, no count update is needed
    if (citizen.reviewState === PersonReviewState.Confirmed) {
      if (this.addedPersonRegisterIds.includes(citizen.registerId)) {
        citizen.reviewState = PersonReviewState.Added;
        return;
      }

      delete citizen.reviewState;
      return;
    }

    if (this.sheet.count.invalid <= 0) {
      this.toast.error(
        'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DETAIL.LIST_FULL.TITLE',
        'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DETAIL.LIST_FULL.MESSAGE',
      );
      return;
    }

    this.sheet.count.invalid--;
    this.sheet.count.valid++;
    delete citizen.reviewState;
  }

  protected add(candidate: CollectionSignatureSheetCandidate): void {
    if (candidate.existingSignature || !candidate.person.isVotingAllowed || !this.collection || !this.sheet) {
      return;
    }

    if (this.sheet.count.invalid <= 0) {
      this.toast.error(
        'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DETAIL.LIST_FULL.TITLE',
        'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DETAIL.LIST_FULL.MESSAGE',
      );
      return;
    }

    candidate.existingSignature = {
      isInSameMunicipality: true,
      isOnSameSheet: true,
      collectionDateTime: new Date(),
      bfs: this.sheet.bfs,
      municipalityName: this.sheet.municipalityName,
      collectionDescription: this.collection.collection.description,
      signatureSheetNumber: this.sheet.number,
      electronic: false,
    };
    candidate.person.reviewState = PersonReviewState.Added;
    this.addedPersonRegisterIds.push(candidate.person.registerId);
    this.citizens = [...insertSorted(this.citizens, { ...candidate.person }, this.personComparer)];
    this.sheet.count.invalid--;
    this.sheet.count.valid++;
  }

  protected async search(filter?: PersonFilterData, pageable?: Pageable): Promise<void> {
    if (!this.collection || !this.sheet) {
      return;
    }

    if (filter && !pageable) {
      pageable = {
        page: 1,
        pageSize: 10,
      };
    }

    filter ??= this.lastUsedFilter;

    if (!filter) {
      throw new Error('filter is required');
    }

    this.lastUsedFilter = filter;
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = this.collectionSignatureSheetService
      .searchPersonCandidates(this.collection.collection.type, this.collection.id, this.sheet.id, filter, pageable)
      .subscribe(page => {
        this.personCandidatesPage = page;
        this.updateCandidatesWithTemporarilyExistingSignature();
      });
  }

  protected updateTotal(delta: number): void {
    if (!this.sheet) {
      return;
    }

    this.sheet.count.total += delta;
    this.sheet.count.invalid += delta;
  }

  protected resetChanges(): void {
    this.sheet = cloneDeep(this.originalSheet);
    this.citizens = cloneDeep(this.originalCitizens ?? []);
    this.personSearchComponent?.reset();
    this.personCandidatesPage = emptyPage<CollectionSignatureSheetCandidate>();
    this.addedPersonRegisterIds = [];
  }

  private updateCandidatesWithTemporarilyExistingSignature(): void {
    if (!this.collection || !this.sheet) {
      return;
    }

    for (const candidate of this.personCandidatesPage.items) {
      const citizen = this.citizens.find(x => x.registerId === candidate.person.registerId);
      if (!citizen) {
        continue;
      }

      candidate.existingSignature = {
        isInSameMunicipality: true,
        isOnSameSheet: true,
        collectionDateTime: new Date(),
        bfs: this.sheet.bfs,
        municipalityName: this.sheet.municipalityName,
        collectionDescription: this.collection.collection.description,
        signatureSheetNumber: this.sheet.number,
        electronic: false,
      };
    }
  }

  private async loadData(collection: Referendum | Initiative, sheet: CollectionSignatureSheet): Promise<void> {
    this.collection = collection;
    this.sheet = sheet;
    this.originalSheet = cloneDeep(this.sheet);

    this.loadingCitizens = true;
    try {
      this.citizens = await this.collectionSignatureSheetService.listCitizens(collection.id, sheet.id);
      this.originalCitizens = cloneDeep(this.citizens);
    } finally {
      this.loadingCitizens = false;
    }
  }

  private async confirmResetChanges(): Promise<boolean> {
    if (!this.hasChanges) {
      return false;
    }

    const result = await this.confirmDialogService.confirm({
      title: 'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DETAIL.RESET_CHANGES.TITLE',
      message: 'COLLECTION.CHECK_SAMPLES.SIGNATURE_SHEETS.DETAIL.RESET_CHANGES.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });

    return !result;
  }

  private async back(): Promise<void> {
    await this.router.navigate(['..'], { relativeTo: this.route });
  }
}
