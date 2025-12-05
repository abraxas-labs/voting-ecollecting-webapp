/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import {
  ButtonModule,
  DialogService,
  DividerModule,
  ExpansionPanelModule,
  IconButtonModule,
  LoadingBarModule,
  SpinnerModule,
  SubNavigationBarModule,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Referendum } from '../../core/models/referendum.model';
import { Initiative } from '../../core/models/initiative.model';
import { firstValueFrom, lastValueFrom, Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { CollectionSignatureSheet, CollectionSignatureSheetCandidate } from '../../core/models/collection.model';
import {
  SignatureSheetEditDialogComponent,
  SignatureSheetEditDialogData,
} from '../signature-sheet-edit-dialog/signature-sheet-edit-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  createComparer,
  emptyPage,
  insertSorted,
  LoadingBarComponent,
  Page,
  Pageable,
  ToastService,
} from 'ecollecting-lib';
import { SignatureSheetPersonSearchComponent } from './signature-sheet-person-search/signature-sheet-person-search.component';
import { Person, PersonFilterData } from '../../core/models/person.model';
import { SignatureSheetCandidatesTableComponent } from './signature-sheet-candidates-table/signature-sheet-candidates-table.component';
import { SignatureSheetCitizenTableComponent } from './signature-sheet-citizen-table/signature-sheet-citizen-table.component';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';
import { SignatureSheetHeaderComponent } from './signature-sheet-header/signature-sheet-header.component';

@Component({
  selector: 'app-signature-sheet-detail',
  imports: [
    ButtonModule,
    DividerModule,
    SpinnerModule,
    SubNavigationBarModule,
    TooltipModule,
    TranslatePipe,
    TruncateWithTooltipModule,
    DecimalPipe,
    IconButtonModule,
    ExpansionPanelModule,
    SignatureSheetPersonSearchComponent,
    LoadingBarModule,
    TableModule,
    SignatureSheetCandidatesTableComponent,
    SignatureSheetCitizenTableComponent,
    LoadingBarComponent,
    SignatureSheetHeaderComponent,
  ],
  templateUrl: './signature-sheet-detail.component.html',
  styleUrl: './signature-sheet-detail.component.scss',
  providers: [DialogService],
})
export class SignatureSheetDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);

  protected collection?: Referendum | Initiative;
  protected sheet?: CollectionSignatureSheet;

  protected personCandidatesPage: Page<CollectionSignatureSheetCandidate> = emptyPage<CollectionSignatureSheetCandidate>();
  protected citizens: Person[] = [];

  protected loadingPersonRegisterId?: string;
  protected loadingCitizens: boolean = true;

  private readonly personComparer = createComparer<Person>('officialName', 'firstName', 'dateOfBirth');

  private readonly routeSubscription: Subscription;
  private searchSubscription?: Subscription;

  private lastUsedFilter?: PersonFilterData;

  @ViewChild('personSearch')
  protected personSearch!: SignatureSheetPersonSearchComponent;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection, sheet }) => this.loadData(collection, sheet));
  }

  protected get searching(): boolean {
    return this.searchSubscription?.closed === false;
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected async back(): Promise<void> {
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  protected async edit(): Promise<void> {
    await this.openEditDialog(false);
  }

  protected async delete(): Promise<void> {
    if (this.sheet === undefined || this.collection === undefined) {
      return;
    }

    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    await this.collectionSignatureSheetService.delete(this.collection.id, this.sheet.id);
    this.toast.success('APP.DELETED');
    await this.back();
  }

  protected async new(): Promise<void> {
    await this.openEditDialog(true);
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
      .subscribe(page => (this.personCandidatesPage = page));
  }

  protected async add(candidate: CollectionSignatureSheetCandidate): Promise<void> {
    if (
      candidate.existingSignature ||
      !candidate.person.isVotingAllowed ||
      !this.collection ||
      !this.sheet ||
      !!this.loadingPersonRegisterId
    ) {
      return;
    }

    if (this.sheet.count.invalid <= 0) {
      this.toast.error('COLLECTION.SIGNATURE_SHEETS.DETAIL.LIST_FULL.TITLE', 'COLLECTION.SIGNATURE_SHEETS.DETAIL.LIST_FULL.MESSAGE');
      return;
    }

    this.loadingPersonRegisterId = candidate.person.registerId;
    try {
      await this.collectionSignatureSheetService.addCitizen(
        this.collection.collection.type,
        this.collection.id,
        this.sheet.id,
        candidate.person.registerId,
      );
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
      this.citizens = [...insertSorted(this.citizens, { ...candidate.person }, this.personComparer)];
      this.sheet.count.invalid--;
      this.sheet.count.valid++;
      this.toast.success('COLLECTION.SIGNATURE_SHEETS.DETAIL.PERSON.ADDED');
    } finally {
      delete this.loadingPersonRegisterId;
    }
  }

  protected async removeCitizen(citizen: Person): Promise<void> {
    if (!this.collection || !this.sheet || !!this.loadingPersonRegisterId) {
      return;
    }

    try {
      this.loadingPersonRegisterId = citizen.registerId;
      await this.collectionSignatureSheetService.removeCitizen(this.collection.id, this.sheet.id, citizen.registerId);
      this.citizens = this.citizens.filter(c => c.registerId !== citizen.registerId);

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

      this.toast.success('APP.DELETED');
    } finally {
      delete this.loadingPersonRegisterId;
    }
  }

  protected reset(): void {
    this.personCandidatesPage = emptyPage();
  }

  private async loadData(collection: Referendum | Initiative, sheet: CollectionSignatureSheet): Promise<void> {
    this.collection = collection;
    this.sheet = sheet;

    this.loadingCitizens = true;
    try {
      this.citizens = await this.collectionSignatureSheetService.listCitizens(collection.id, sheet.id);
    } finally {
      this.loadingCitizens = false;
    }
  }

  private async openEditDialog(createNew: boolean): Promise<void> {
    if (this.collection === undefined) {
      return;
    }

    const dialogRef = this.dialogService.open(SignatureSheetEditDialogComponent, {
      collectionId: this.collection.id,
      sheet: createNew ? undefined : this.sheet,
    } satisfies SignatureSheetEditDialogData);

    const id = await lastValueFrom(dialogRef.afterClosed());
    if (id && id !== this.sheet?.id) {
      await this.router.navigate(['..', id], { relativeTo: this.route });
      this.personSearch.reset();
      this.searchSubscription?.unsubscribe();
      delete this.lastUsedFilter;
    }
  }
}
