/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnInit, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ButtonModule,
  DialogService,
  IconButtonModule,
  SegmentedControl,
  SegmentedControlGroupModule,
  SpinnerModule,
  StatusLabelModule,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { ConfirmDialogComponent, persistentStorage, storageKeyPrefix, ConfirmDialogData, ToastService } from 'ecollecting-lib';
import { InitiativeService } from '../../core/services/initiative.service';
import { Initiative } from '../../core/models/initiative.model';
import { AdmissibilityDecisionsTableComponent } from './admissibility-decisions-table/admissibility-decisions-table.component';
import { CollectionPeriodState, CollectionState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { firstValueFrom } from 'rxjs';
import {
  AdmissibilityDecisionDialogComponent,
  AdmissibilityDecisionDialogData,
  AdmissibilityDecisionDialogResult,
} from './admissibility-decision-dialog/admissibility-decision-dialog.component';
import { Router } from '@angular/router';
import { initiativeUrl } from '../../app.routes';

const filters = ['ALL', 'ACTIVE'] as const;
type Filter = (typeof filters)[number];

const filterKey = storageKeyPrefix + 'admissibility-decisions-filter';

@Component({
  selector: 'app-admissibility-decisions',
  imports: [
    TranslatePipe,
    SegmentedControlGroupModule,
    TableModule,
    SpinnerModule,
    TooltipModule,
    TruncateWithTooltipModule,
    StatusLabelModule,
    IconButtonModule,
    AdmissibilityDecisionsTableComponent,
    ButtonModule,
  ],
  templateUrl: './admissibility-decisions.component.html',
  styleUrl: 'admissibility-decisions.component.scss',
  providers: [DialogService],
})
export class AdmissibilityDecisionsComponent implements OnInit {
  private readonly initiativeService = inject(InitiativeService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected filters: SegmentedControl[];
  protected filter?: Filter;

  protected loading = true;
  protected filteredData: Initiative[] = [];

  private data: Initiative[] = [];

  constructor() {
    const i18n = inject(TranslateService);

    this.filters = filters.map(value => ({
      displayText: i18n.instant('ADMIN.ADMISSIBILITY_DECISIONS.FILTER.' + value),
      disabled: false,
      size: 'small',
      value,
    }));

    this.filter = (persistentStorage.getItem(filterKey) ?? 'ACTIVE') as Filter;
    if (!filters.includes(this.filter)) {
      this.filter = 'ACTIVE';
    }
  }

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  protected setFilter(filter: Filter): void {
    this.filter = filter;
    persistentStorage.setItem(filterKey, filter);
    this.applyFilter();
  }

  protected async delete(initiative: Initiative): Promise<void> {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    await this.initiativeService.deleteAdmissibilityDecisions(initiative.id);
    this.data = this.data.filter(x => x.id !== initiative.id);
    this.filteredData = this.filteredData.filter(x => x.id !== initiative.id);
    this.toastService.deleted();
  }

  protected async editOrNew(initiative?: Initiative): Promise<void> {
    const isNew = !initiative;
    const ref = this.dialogService.open(AdmissibilityDecisionDialogComponent, { initiative } satisfies AdmissibilityDecisionDialogData);
    const result = (await firstValueFrom(ref.afterClosed())) as AdmissibilityDecisionDialogResult;
    if (!result?.initiative) {
      return;
    }

    if (
      result.initiative.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH &&
      result.initiative.collection.state === CollectionState.COLLECTION_STATE_PRE_RECORDED &&
      isNew
    ) {
      await this.openInitiative(result.initiative.id);
      return;
    }

    const idx = this.data.findIndex(x => x.id === result.initiative!.id);
    if (idx === -1) {
      this.data = [result.initiative, ...this.data];
    } else {
      this.data[idx] = result.initiative;
      this.data = [...this.data];
    }
    this.applyFilter();
  }

  protected async openInitiative(id: string): Promise<void> {
    await this.router.navigate(['-', initiativeUrl, id]);
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      this.data = await this.initiativeService.listAdmissibilityDecisions();
      this.applyFilter();
    } finally {
      this.loading = false;
    }
  }

  private applyFilter(): void {
    this.filteredData =
      this.filter === 'ALL'
        ? this.data
        : this.data.filter(x => x.collection.periodState === CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION);
  }
}
