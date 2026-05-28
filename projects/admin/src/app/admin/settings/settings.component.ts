/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { DomainOfInfluenceService } from '../../core/services/domain-of-influence.service';
import { DomainOfInfluence } from '../../core/models/domain-of-influence.model';
import { DomainOfInfluenceSettingsComponent } from './domain-of-influence-settings/domain-of-influence-settings.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AutocompleteModule, IconModule, SpinnerModule } from '@abraxas/base-components';
import { FormsModule } from '@angular/forms';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { ConfirmDialogService, HasUnsavedChanges } from 'ecollecting-lib';

@Component({
  selector: 'app-settings',
  imports: [DomainOfInfluenceSettingsComponent, TranslatePipe, SpinnerModule, AutocompleteModule, FormsModule, IconModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, HasUnsavedChanges {
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly cd = inject(ChangeDetectorRef);
  private showValidationErrorsValue: boolean = false;
  private domainOfInfluenceSettingsValue?: DomainOfInfluenceSettingsComponent;

  @ViewChild(DomainOfInfluenceSettingsComponent)
  private set domainOfInfluenceSettingsComponent(value: DomainOfInfluenceSettingsComponent | undefined) {
    this.domainOfInfluenceSettingsValue = value;
    if (value) {
      value.showValidationErrors = this.showValidationErrorsValue;
    }
  }

  protected domainOfInfluences: DomainOfInfluence[] = [];
  protected statusMessage?: 'saving' | 'saved';
  protected loading: boolean = true;
  protected selectedDoi?: DomainOfInfluence;
  private isCheckingUnsavedChanges: boolean = false;

  public async ngOnInit(): Promise<void> {
    try {
      this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, undefined, true);
      this.removeInheritedValues(this.domainOfInfluences);
      this.selectedDoi = this.domainOfInfluences[0];
    } finally {
      this.loading = false;
    }
  }

  public get hasUnsavedChanges(): boolean {
    return this.domainOfInfluenceSettingsValue?.hasUnsavedChanges ?? false;
  }

  public get showValidationErrors(): boolean {
    return this.showValidationErrorsValue;
  }

  public set showValidationErrors(value: boolean) {
    this.showValidationErrorsValue = value;
    if (this.domainOfInfluenceSettingsValue) {
      this.domainOfInfluenceSettingsValue.showValidationErrors = value;
    }
  }

  protected async selectDoi(doi: DomainOfInfluence): Promise<void> {
    if (this.isCheckingUnsavedChanges || doi === this.selectedDoi) {
      return;
    }

    const previousDoi = this.selectedDoi;

    if (!this.hasUnsavedChanges) {
      this.selectedDoi = doi;
      return;
    }

    this.isCheckingUnsavedChanges = true;
    try {
      this.showValidationErrors = true;
      const discard = await this.confirmDialogService.confirm({
        title: 'APP.INVALID_FORM_VALUES.TITLE',
        message: 'APP.INVALID_FORM_VALUES.MSG',
        confirmText: 'APP.YES',
        discardText: 'APP.DISCARD',
      });

      if (!discard) {
        // reset selection to previous doi.
        // Internally the base component has the new doi marked as the selected one already.
        // To select the old one again, we need to trigger change detection.
        // First set the selected doi to undefined, then set it back to the previous one in the next tick.
        this.selectedDoi = undefined;
        this.cd.detectChanges();
        this.selectedDoi = previousDoi;
        this.cd.detectChanges();
        return;
      }

      this.selectedDoi = doi;
    } finally {
      this.isCheckingUnsavedChanges = false;
    }
  }

  private removeInheritedValues(domainOfInfluences: DomainOfInfluence[]): void {
    for (const domainOfInfluence of domainOfInfluences) {
      switch (domainOfInfluence.type) {
        case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU:
          delete domainOfInfluence.settings.initiativeMaxElectronicSignaturePercent;
          delete domainOfInfluence.settings.referendumMaxElectronicSignaturePercent;
          break;
        case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT:
          delete domainOfInfluence.settings.initiativeMinSignatureCount;
          break;
        case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH:
          delete domainOfInfluence.settings.initiativeMaxElectronicSignaturePercent;
          delete domainOfInfluence.settings.initiativeMinSignatureCount;
          break;
      }
    }
  }
}
