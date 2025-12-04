/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { DecreeCardComponent, ReferendumCardComponent } from 'ecollecting-lib';
import { VotingLibModule } from '@abraxas/voting-lib';
import { ButtonModule, DialogService, ErrorModule, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Decree, DecreeGroup } from '../../../core/models/decree.model';
import { firstValueFrom } from 'rxjs';
import { SeekReferendumDialogComponent, SeekReferendumDialogData } from '../seek-referendum-dialog/seek-referendum-dialog.component';
import { ReferendumService } from '../../../core/services/referendum.service';
import { Referendum } from '../../../core/models/referendum.model';
import { NgTemplateOutlet } from '@angular/common';
import { DecreeDoiTypeCardComponent } from '../decree-doi-type-card/decree-doi-type-card.component';
import { CollectionService } from '../../../core/services/collection.service';

@Component({
  selector: 'app-referendum-overview',
  imports: [
    VotingLibModule,
    DecreeDoiTypeCardComponent,
    ButtonModule,
    TranslatePipe,
    DecreeCardComponent,
    ReadonlyModule,
    ReferendumCardComponent,
    NgTemplateOutlet,
    ErrorModule,
    SpinnerModule,
  ],
  templateUrl: './seek-referendum-overview.component.html',
})
export class SeekReferendumOverviewComponent implements OnInit {
  private readonly referendumService = inject(ReferendumService);
  private readonly collectionService = inject(CollectionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);

  public loading: boolean = false;
  public myDecrees: Decree[] = [];
  public myReferendumsWithoutDecree: Referendum[] = [];
  public decreeGroups: DecreeGroup[] = [];

  protected isDownloadingElectronicSignaturesProtocolOfId?: string;

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      const response = await this.referendumService.listMy();
      this.myDecrees = response.decrees;
      this.myReferendumsWithoutDecree = response.withoutDecreeReferendums;

      this.decreeGroups = await this.referendumService.listDecreesEligibleForReferendum(true);
    } finally {
      this.loading = false;
    }
  }

  public async createReferendum(decree?: Decree): Promise<void> {
    const dialogRef = this.dialogService.open(SeekReferendumDialogComponent, { decreeId: decree?.id } satisfies SeekReferendumDialogData);
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    await this.open(result.id);
  }

  public async open(id: string): Promise<void> {
    await this.router.navigate([id], { relativeTo: this.route });
  }

  public async downloadElectronicSignaturesProtocol(id: string): Promise<void> {
    this.isDownloadingElectronicSignaturesProtocolOfId = id;
    try {
      await this.collectionService.downloadElectronicSignaturesProtocol(id);
    } finally {
      delete this.isDownloadingElectronicSignaturesProtocolOfId;
    }
  }
}
