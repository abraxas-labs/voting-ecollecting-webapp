/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import {
  AlertBarModule,
  ButtonModule,
  DialogService,
  SegmentedControl,
  SegmentedControlGroupModule,
  SpinnerModule,
} from '@abraxas/base-components';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CollectionControlSignFilter } from '@abraxas/voting-ecollecting-proto/admin';
import { CollectionService } from '../core/services/collection.service';
import {
  ConfirmDialogService,
  DecreeCardComponent,
  DoiTypeCardComponent,
  InitiativeCardComponent,
  MunicipalityFilterComponent,
  ReferendumCardComponent,
  ToastService,
} from 'ecollecting-lib';
import { DatePipe } from '@angular/common';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { firstValueFrom } from 'rxjs';
import { DomainOfInfluenceService } from '../core/services/domain-of-influence.service';
import { CollectionsGroup } from '../core/models/collections-group.model';
import { ControlSignSensitiveDataExpiryDialogComponent } from './control-sign-sensitive-data-expiry-dialog/control-sign-sensitive-data-expiry-dialog.component';
import { SecondFactorTransactionService, VotingLibModule } from '@abraxas/voting-lib';
import { DomainOfInfluence } from '../core/models/domain-of-influence.model';
import { InitiativeService } from '../core/services/initiative.service';
import { Initiative } from '../core/models/initiative.model';
import { Decree } from '../core/models/decree.model';
import { DecreeService } from '../core/services/decree.service';

@Component({
  selector: 'app-control-signs',
  imports: [
    SegmentedControlGroupModule,
    SpinnerModule,
    AlertBarModule,
    ButtonModule,
    DoiTypeCardComponent,
    InitiativeCardComponent,
    MunicipalityFilterComponent,
    TranslatePipe,
    DecreeCardComponent,
    ReferendumCardComponent,
    DatePipe,
    VotingLibModule,
  ],
  templateUrl: './control-signs.component.html',
  providers: [DialogService],
})
export class ControlSignsComponent implements OnInit {
  private readonly doiService = inject(DomainOfInfluenceService);
  private readonly initiativeService = inject(InitiativeService);
  private readonly decreeService = inject(DecreeService);
  private readonly collectionService = inject(CollectionService);
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly secondFactorTransactionService = inject(SecondFactorTransactionService);
  private readonly toast = inject(ToastService);

  protected readonly municipalityDoiType = DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU;
  protected readonly filters: SegmentedControl[];
  protected readonly filterValues = CollectionControlSignFilter;
  protected filter: CollectionControlSignFilter;
  protected loading = false;
  protected loadingMunicipality = false;
  protected groups: CollectionsGroup[] = [];
  protected municipalities: DomainOfInfluence[] = [];
  protected selectedMunicipality?: DomainOfInfluence;
  protected deletingId?: string;
  private doiTypes: DomainOfInfluenceType[] = [];

  constructor() {
    const i18n = inject(TranslateService);

    this.filters = [
      {
        value: CollectionControlSignFilter.COLLECTION_CONTROL_SIGN_FILTER_REMINDER_SET,
        displayText: i18n.instant('CONTROL_SIGNS.FILTER.REMINDER_SET'),
        disabled: false,
      },
      {
        value: CollectionControlSignFilter.COLLECTION_CONTROL_SIGN_FILTER_READY_TO_DELETE,
        displayText: i18n.instant('CONTROL_SIGNS.FILTER.READY_TO_DELETE'),
        disabled: false,
      },
    ];
    this.filter = this.filters[0].value;
  }

  public async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      this.doiTypes = await this.doiService.listOwnTypes();

      if (this.doiTypes.includes(DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU)) {
        this.municipalities = await this.doiService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU], false);

        if (this.municipalities.length === 1) {
          this.selectedMunicipality = this.municipalities[0];
        }
      }

      await this.loadData();
    } finally {
      this.loading = false;
    }
  }

  protected async loadData(): Promise<void> {
    try {
      this.loading = true;
      this.groups = [];

      if (
        this.doiTypes.length > 1 ||
        (this.doiTypes.length > 0 && !this.doiTypes.includes(DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU))
      ) {
        this.groups = await this.collectionService.listForDeletion(
          this.filter,
          this.doiTypes.filter(x => x !== DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU),
        );
      }

      if (this.selectedMunicipality) {
        await this.loadMunicipality();
      }
    } finally {
      this.loading = false;
    }
  }

  protected async loadMunicipality(): Promise<void> {
    if (!this.selectedMunicipality) {
      this.groups = [
        ...this.groups.filter(g => g.domainOfInfluenceType !== DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU),
        { domainOfInfluenceType: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU, initiatives: [], decrees: [] },
      ];
      return;
    }

    this.loadingMunicipality = true;
    try {
      const muGroup = (
        await this.collectionService.listForDeletion(
          this.filter,
          [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU],
          this.selectedMunicipality.bfs,
        )
      )[0];
      this.groups = [...this.groups.filter(x => x.domainOfInfluenceType !== DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU), muGroup];
    } finally {
      this.loadingMunicipality = false;
    }
  }

  protected async deleteInitiative(initiative: Initiative, group: CollectionsGroup): Promise<void> {
    try {
      const ok = await this.confirmDialogService.confirm({
        title: 'APP.DELETE.TITLE',
        message: 'CONTROL_SIGNS.DELETE.MSG',
        confirmText: 'CONTROL_SIGNS.DELETE.CONFIRM',
        discardText: 'APP.DISCARD',
        confirmColor: 'warn',
      });
      if (!ok) {
        return;
      }

      this.deletingId = initiative.id;
      const transaction = await this.initiativeService.prepareDelete(initiative.id);
      await this.secondFactorTransactionService.showDialogAndExecuteVerifyAction(
        () => this.initiativeService.delete(initiative.id, transaction.id),
        transaction,
      );

      group.initiatives = group.initiatives.filter(i => i.id !== initiative.id);
      this.toast.success('APP.DELETED');
    } finally {
      delete this.deletingId;
    }
  }

  protected async setInitiativeSensitiveDataExpiryDate(initiative: Initiative, group: CollectionsGroup): Promise<void> {
    const dialogRef = this.dialogService.open(ControlSignSensitiveDataExpiryDialogComponent, { initiative });
    const saved = await firstValueFrom(dialogRef.afterClosed());

    if (saved && this.filter === CollectionControlSignFilter.COLLECTION_CONTROL_SIGN_FILTER_READY_TO_DELETE) {
      group.initiatives = group.initiatives.filter(i => i.id !== initiative.id);
    }
  }

  protected async deleteDecree(decree: Decree, group: CollectionsGroup): Promise<void> {
    try {
      const ok = await this.confirmDialogService.confirm({
        title: 'APP.DELETE.TITLE',
        message: 'CONTROL_SIGNS.DELETE.MSG',
        confirmText: 'CONTROL_SIGNS.DELETE.CONFIRM',
        discardText: 'APP.DISCARD',
        confirmColor: 'warn',
      });
      if (!ok) {
        return;
      }

      this.deletingId = decree.id;
      const transaction = await this.decreeService.prepareDelete(decree.id);
      await this.secondFactorTransactionService.showDialogAndExecuteVerifyAction(
        () => this.decreeService.delete(decree.id, transaction.id),
        transaction,
      );

      group.decrees = group.decrees.filter(i => i.id !== decree.id);
      this.toast.success('APP.DELETED');
    } finally {
      delete this.deletingId;
    }
  }

  protected async setDecreeSensitiveDataExpiryDate(decree: Decree, group: CollectionsGroup): Promise<void> {
    const dialogRef = this.dialogService.open(ControlSignSensitiveDataExpiryDialogComponent, { decree });
    const saved = await firstValueFrom(dialogRef.afterClosed());

    if (saved && this.filter === CollectionControlSignFilter.COLLECTION_CONTROL_SIGN_FILTER_READY_TO_DELETE) {
      group.decrees = group.decrees.filter(i => i.id !== decree.id);
    }
  }
}
