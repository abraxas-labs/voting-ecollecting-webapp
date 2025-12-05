/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule, DialogService, SpinnerModule } from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { DecreeEditDialogComponent } from '../decree-edit-dialog/decree-edit-dialog.component';
import { Decree } from '../../../core/models/decree.model';
import { ConfirmDialogComponent, ConfirmDialogData, ToastService } from 'ecollecting-lib';
import { DecreeService } from '../../../core/services/decree.service';
import { DecreeTableComponent } from '../decree-table/decree-table.component';
import { DomainOfInfluenceService } from '../../../core/services/domain-of-influence.service';
import { VotingLibModule } from '@abraxas/voting-lib';
import { firstValueFrom } from 'rxjs';
import { DomainOfInfluence } from '../../../core/models/domain-of-influence.model';

@Component({
  selector: 'app-decree-overview',
  templateUrl: './decree-overview.component.html',
  imports: [ButtonModule, TranslateModule, DecreeTableComponent, VotingLibModule, SpinnerModule],
  providers: [DialogService, DecreeService],
})
export class DecreeOverviewComponent implements OnInit {
  private readonly dialogService = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly decreeService = inject(DecreeService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);

  public decrees: Decree[] = [];
  public loading: boolean = false;
  public domainOfInfluenceTree: DomainOfInfluence[] = [];
  public hideCreateButton: boolean = false;

  public async ngOnInit(): Promise<void> {
    await this.loadData();
    this.hideCreateButton = this.domainOfInfluenceTree.length <= 0;
  }

  public async openDialog(decree?: Decree): Promise<void> {
    const dialogRef = this.dialogService.open(DecreeEditDialogComponent, {
      decree: decree,
      domainOfInfluenceTree: this.domainOfInfluenceTree,
    });
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    const updatedDecree = result.decree;
    const index = this.decrees.findIndex(c => c.id === updatedDecree.id);
    if (index === -1) {
      this.decrees = [...this.decrees, updatedDecree];
      return;
    }

    this.decrees[index] = updatedDecree;

    // to trigger change detection
    this.decrees = [...this.decrees];
  }

  public async deleteDecree(decree: Decree): Promise<void> {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    await this.decreeService.deletePublished(decree);
    this.decrees = this.decrees.filter(d => d.id !== decree.id);
    this.toast.deleted();
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      this.decrees = await this.decreeService.list();
      this.domainOfInfluenceTree = await this.domainOfInfluenceService.list(true);
    } finally {
      this.loading = false;
    }
  }
}
