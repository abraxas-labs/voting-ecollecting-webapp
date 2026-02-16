/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { Initiative } from '../../core/models/initiative.model';
import { Referendum } from '../../core/models/referendum.model';
import { firstValueFrom, lastValueFrom, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthenticationService,
  ButtonModule,
  DialogService,
  DividerModule,
  SpinnerModule,
  SubNavigationBarModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { SignatureSheetTableComponent } from './signature-sheet-table/signature-sheet-table.component';
import { CollectionSignatureSheet } from '../../core/models/collection.model';
import { CollectionSignatureSheetState } from '@abraxas/voting-ecollecting-proto/admin';
import {
  SignatureSheetEditDialogComponent,
  SignatureSheetEditDialogData,
} from '../signature-sheet-edit-dialog/signature-sheet-edit-dialog.component';
import {
  CollectionCommitteeAddressDialogComponent,
  CollectionCommitteeAddressDialogData,
  CollectionCommitteeAddressDialogResult,
} from '../../core/components/collection-committee-address-dialog/collection-committee-address-dialog.component';
import { CollectionSignatureSheetService } from '../../core/services/collection-signature-sheet.service';
import { isAddressComplete } from 'ecollecting-lib';

@Component({
  selector: 'app-signature-sheet-overview',
  imports: [
    SubNavigationBarModule,
    TranslatePipe,
    DividerModule,
    ButtonModule,
    SignatureSheetTableComponent,
    TruncateWithTooltipModule,
    SpinnerModule,
  ],
  templateUrl: './signature-sheet-overview.component.html',
  providers: [DialogService],
})
export class SignatureSheetOverviewComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);
  private readonly auth = inject(AuthenticationService);

  protected readonly sheetStates = CollectionSignatureSheetState;
  protected collection?: Initiative | Referendum;
  protected selected: CollectionSignatureSheet[] = [];
  protected selectedAttested: CollectionSignatureSheet[] = [];

  protected isAttesting = false;
  protected isReattesting = false;

  private readonly routeSubscription: Subscription;

  @ViewChild('createdTable')
  public createdTable!: SignatureSheetTableComponent;

  @ViewChild('attestedTable')
  public attestedTable!: SignatureSheetTableComponent;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection }) => this.loadData(collection));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected async back(): Promise<void> {
    await this.router.navigate(['../../'], { relativeTo: this.route });
  }

  protected async new(): Promise<void> {
    if (this.collection === undefined) {
      return;
    }

    const dialogRef = this.dialogService.open(SignatureSheetEditDialogComponent, {
      collectionId: this.collection.id,
    } satisfies SignatureSheetEditDialogData);

    const id = await lastValueFrom(dialogRef.afterClosed());
    if (id) {
      await this.router.navigate([id], { relativeTo: this.route });
    }
  }

  protected async attest(): Promise<void> {
    try {
      this.isAttesting = true;
      await this.attestSheets(this.selected, true);
    } finally {
      this.isAttesting = false;
    }
  }

  protected async reattest(): Promise<void> {
    try {
      this.isReattesting = true;
      await this.attestSheets(this.selectedAttested, false);
    } finally {
      this.isReattesting = false;
    }
  }

  private async loadData(collection: Referendum | Initiative): Promise<void> {
    this.collection = collection;
    await this.checkCommitteeAddress();
  }

  private async attestSheets(sheets: CollectionSignatureSheet[], move: boolean): Promise<void> {
    if (!this.collection) {
      return;
    }

    const userProfile = await this.auth.getUserProfile();

    const sheetIds = sheets.map(x => x.id);
    await this.collectionSignatureSheetService.attest(this.collection.id, sheetIds);

    const newAttestedAt = new Date();
    for (const sheet of sheets) {
      sheet.attestedAt ??= newAttestedAt;
      sheet.modifiedByName = userProfile.info.name;
    }

    if (move) {
      this.createdTable.remove(sheets);
      await this.attestedTable.reload();
    }
  }

  private async checkCommitteeAddress(): Promise<void> {
    if (!this.collection || isAddressComplete(this.collection.collection.address)) {
      return;
    }

    const dialogRef = this.dialogService.open(CollectionCommitteeAddressDialogComponent, {
      collectionId: this.collection.id,
    } satisfies CollectionCommitteeAddressDialogData);
    const result: CollectionCommitteeAddressDialogResult = await firstValueFrom(dialogRef.afterClosed());
    this.collection.collection.address = result.address;
  }
}
