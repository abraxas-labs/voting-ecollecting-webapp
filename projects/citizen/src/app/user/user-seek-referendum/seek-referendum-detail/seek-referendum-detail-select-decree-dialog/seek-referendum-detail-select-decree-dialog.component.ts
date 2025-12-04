/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import { ReferendumService } from '../../../../core/services/referendum.service';
import { Decree, DecreeGroup } from '../../../../core/models/decree.model';
import { ButtonModule, ErrorModule, SpinnerModule } from '@abraxas/base-components';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent, ReferendumCardComponent } from 'ecollecting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DecreeDoiTypeCardComponent } from '../../decree-doi-type-card/decree-doi-type-card.component';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-seek-referendum-detail-select-decree-dialog',
  templateUrl: './seek-referendum-detail-select-decree-dialog.component.html',
  imports: [DecreeDoiTypeCardComponent, SpinnerModule, ButtonModule, ErrorModule, ReferendumCardComponent, TranslatePipe, DialogComponent],
})
export class SeekReferendumDetailSelectDecreeDialogComponent
  extends BaseDialogWithUnsavedChangesCheckComponent<
    SeekReferendumDetailSelectDecreeDialogComponent,
    SeekReferendumDetailSelectDecreeDialogResult
  >
  implements OnInit
{
  private readonly referendumService = inject(ReferendumService);

  public readonly originalSelectedDecreeId?: string;

  public decreeGroups: DecreeGroup[] = [];
  public loading: boolean = false;
  public saving: boolean = false;
  public referendumId: string;

  public selectedDecreeId?: string;
  public selectedDecreeDescription?: string;

  constructor() {
    super();
    const dialogData = inject<SeekReferendumDetailSelectDecreeDialogData>(MAT_DIALOG_DATA);
    this.referendumId = dialogData.referendumId;
    this.selectedDecreeId = dialogData.decreeId;
    this.originalSelectedDecreeId = this.selectedDecreeId;
  }

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  public async save(): Promise<void> {
    if (!this.selectedDecreeId) {
      return;
    }

    try {
      this.saving = true;
      await this.referendumService.updateDecree(this.referendumId, this.selectedDecreeId);
      this.dialogRef.close({
        decreeId: this.selectedDecreeId,
        decreeDescription: this.selectedDecreeDescription,
      } satisfies SeekReferendumDetailSelectDecreeDialogResult);
    } finally {
      this.saving = false;
    }
  }

  public selectDecree(decree: Decree): void {
    this.selectedDecreeId = decree.id;
    this.selectedDecreeDescription = decree.description;
  }

  protected override get hasChanges(): boolean {
    return this.originalSelectedDecreeId !== this.selectedDecreeId;
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      this.decreeGroups = await this.referendumService.listDecreesEligibleForReferendum(false, [
        DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH,
        DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT,
      ]);
    } finally {
      this.loading = false;
    }
  }
}

export interface SeekReferendumDetailSelectDecreeDialogData {
  referendumId: string;
  decreeId?: string;
}

export interface SeekReferendumDetailSelectDecreeDialogResult {
  decreeId: string;
  decreeDescription?: string;
}
