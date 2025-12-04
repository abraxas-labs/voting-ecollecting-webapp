/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { ButtonModule, DialogService, ReadonlyModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { VotingLibModule } from '@abraxas/voting-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InitiativeCardComponent } from 'ecollecting-lib';
import { LaunchInitiativeDialogComponent } from '../launch-initiative-dialog/launch-initiative-dialog.component';
import { InitiativeService } from '../../../core/services/initiative.service';
import { Initiative } from '../../../core/models/initiative.model';
import { CollectionService } from '../../../core/services/collection.service';

@Component({
  selector: 'app-launch-initiative-overview',
  imports: [ButtonModule, TranslatePipe, VotingLibModule, InitiativeCardComponent, ReadonlyModule, SpinnerModule],
  templateUrl: './launch-initiative-overview.component.html',
  providers: [DialogService],
})
export class LaunchInitiativeOverviewComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly initiativeService = inject(InitiativeService);
  private readonly collectionService = inject(CollectionService);

  protected loading: boolean = true;

  protected initiatives: Initiative[] = [];

  protected isDownloadingElectronicSignaturesProtocolOfId?: string;

  public async createInitiative(): Promise<void> {
    const dialogRef = this.dialogService.open(LaunchInitiativeDialogComponent, {});
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    await this.open(result.id);
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.initiatives = await this.initiativeService.listMy();
    } finally {
      this.loading = false;
    }
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
