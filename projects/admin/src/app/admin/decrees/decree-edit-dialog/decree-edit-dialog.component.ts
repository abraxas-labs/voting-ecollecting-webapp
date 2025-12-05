/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Decree, newDecree } from '../../../core/models/decree.model';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent, getDate, ToastService } from 'ecollecting-lib';
import { DecreeService } from '../../../core/services/decree.service';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { Component, inject } from '@angular/core';
import {
  DateModule,
  DialogService,
  DropdownModule,
  ErrorModule,
  IconButtonModule,
  IconModule,
  NumberModule,
  TextareaModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { cloneDeep, isEqual } from 'lodash';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DomainOfInfluence } from '../../../core/models/domain-of-influence.model';

@Component({
  selector: 'app-decree-edit-dialog',
  templateUrl: './decree-edit-dialog.component.html',
  styleUrls: ['./decree-edit-dialog.component.scss'],
  imports: [
    CommonModule,
    DropdownModule,
    TranslateModule,
    TextareaModule,
    DateModule,
    NumberModule,
    TextModule,
    ErrorModule,
    IconButtonModule,
    DatePipe,
    DialogComponent,
    IconModule,
    ReactiveFormsModule,
  ],
  providers: [DecreeService, DialogService],
})
export class DecreeEditDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<DecreeEditDialogData, DecreeEditDialogResult> {
  private readonly decreeService = inject(DecreeService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  public readonly now: Date;
  public readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  public decree: Decree = newDecree();
  public domainOfInfluenceTypeItems: EnumItemDescriptionWithDisabled<DomainOfInfluenceType>[] = [];
  public domainOfInfluenceTree: DomainOfInfluence[] = [];
  public selectedDomainOfInfluence: DomainOfInfluence | undefined;
  public originalDecree: Decree;
  public isNew: boolean = true;
  public hasDataChanged: boolean = false;
  public saving: boolean = false;
  public isCantonTenant: boolean = false;
  public form!: FormGroup<Form>;

  constructor() {
    super();
    const dialogData = inject<DecreeEditDialogData>(MAT_DIALOG_DATA);
    this.now = new Date();
    this.now.setHours(0, 0, 0, 0);

    this.isNew = !dialogData.decree;
    if (dialogData.decree) {
      this.decree = cloneDeep(dialogData.decree);
    }

    this.originalDecree = cloneDeep(this.decree);
    this.domainOfInfluenceTree = dialogData.domainOfInfluenceTree ?? [];
    this.selectedDomainOfInfluence = this.getDomainOfInfluenceByType(this.decree.domainOfInfluenceType);

    this.isCantonTenant = this.domainOfInfluenceTree.some(
      doi =>
        doi.type === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH || doi.type === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT,
    );

    this.domainOfInfluenceTypeItems = [
      {
        value: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH,
        description: this.translate.instant('DOMAIN_OF_INFLUENCE.TYPES.' + DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH),
        disabled: !this.domainOfInfluenceTree.some(doi => doi.type === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH),
      },
      {
        value: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT,
        description: this.translate.instant('DOMAIN_OF_INFLUENCE.TYPES.' + DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT),
        disabled: !this.domainOfInfluenceTree.some(doi => doi.type === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT),
      },
      {
        value: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU,
        description: this.translate.instant('DOMAIN_OF_INFLUENCE.TYPES.' + DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU),
        disabled:
          this.isCantonTenant || !this.domainOfInfluenceTree.some(doi => doi.type === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU),
      },
    ];

    this.buildForm();
    this.contentChanged();
  }

  public get canSave(): boolean {
    return this.form.valid && this.decree.domainOfInfluenceType !== DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED;
  }

  public async save(): Promise<void> {
    try {
      this.saving = true;

      if (this.isNew) {
        const result = await this.decreeService.create(this.decree);
        Object.assign(this.decree, result);
      } else {
        await this.decreeService.update(this.decree);
      }

      this.toast.saved();
      this.hasDataChanged = false;
      this.dialogRef.close({
        decree: this.decree,
      });
    } finally {
      this.saving = false;
    }
  }

  public changeDomainOfInfluenceType(doiType: DomainOfInfluenceType) {
    // initial load
    if (this.decree.domainOfInfluenceType === doiType) {
      return;
    }

    this.decree.domainOfInfluenceType = doiType;
    this.selectedDomainOfInfluence = this.getDomainOfInfluenceByType(doiType);

    if (this.decree.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH) {
      this.decree.link = '';
    }

    if (this.selectedDomainOfInfluence) {
      this.decree.minSignatureCount = this.selectedDomainOfInfluence.settings.referendumMinSignatureCount;
      this.decree.maxElectronicSignatureCount = this.calculateMaxSignatureCount(
        this.selectedDomainOfInfluence.settings.referendumMaxElectronicSignaturePercent,
      );
      this.decree.bfs = this.selectedDomainOfInfluence.bfs;
    }

    this.contentChanged();
  }

  public changeMinSignatureCount(minSignatureCount?: number | null) {
    if (!minSignatureCount) {
      this.decree.maxElectronicSignatureCount = 0;
      return;
    }

    this.decree.minSignatureCount = minSignatureCount;

    if (this.selectedDomainOfInfluence) {
      this.decree.maxElectronicSignatureCount = this.calculateMaxSignatureCount(
        this.selectedDomainOfInfluence.settings.referendumMaxElectronicSignaturePercent,
      );
    }

    this.contentChanged();
  }

  public contentChanged(): void {
    this.hasDataChanged = !isEqual(this.decree, this.originalDecree);
  }

  public checkDateValidity(): void {
    this.form.controls.collectionStartDate.updateValueAndValidity();
    this.form.controls.collectionEndDate.updateValueAndValidity();
  }

  protected override get hasChanges(): boolean {
    return this.hasDataChanged;
  }

  protected updateCollectionStartDate(value: string): void {
    this.decree.collectionStartDate = getDate(value, 0, 0);
    this.checkDateValidity();
    this.contentChanged();
  }

  protected updateCollectionEndDate(value: string): void {
    this.decree.collectionEndDate = getDate(value, 23, 59);
    this.checkDateValidity();
    this.contentChanged();
  }

  private calculateMaxSignatureCount(percent: number): number {
    return Math.round((this.decree.minSignatureCount * percent) / 100);
  }

  private getDomainOfInfluenceByType(type: DomainOfInfluenceType): DomainOfInfluence | undefined {
    return this.domainOfInfluenceTree.find(doi => doi.type === type);
  }

  private collectionStartDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      let date = getDate(value, 0, 0);
      return date && date < this.now ? { dateNotInFuture: true } : null;
    };
  }

  private collectionEndDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      let date = getDate(value, 0, 0);
      return date && this.decree.collectionStartDate && date <= this.decree.collectionStartDate
        ? { dateNotOlderThanStartDate: true }
        : null;
    };
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      description: this.formBuilder.control(this.decree.description, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(1000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
      collectionStartDate: this.formBuilder.control(this.decree.collectionStartDate, {
        validators: [Validators.required, this.collectionStartDateValidator()],
      }),
      collectionEndDate: this.formBuilder.control(this.decree.collectionEndDate, {
        validators: [Validators.required, this.collectionEndDateValidator()],
      }),
      minSignatureCount: this.formBuilder.control(this.decree.minSignatureCount, {
        validators: [Validators.required, Validators.min(0), Validators.max(100000)],
      }),
      maxElectronicSignatureCount: this.formBuilder.control(this.decree.maxElectronicSignatureCount, {
        validators: [Validators.required, Validators.min(0), Validators.max(100000)],
      }),
      link: this.formBuilder.control(this.decree.link, {
        validators: [Validators.minLength(1), Validators.maxLength(2000)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
    });
  }
}

export interface DecreeEditDialogData {
  decree?: Decree;
  domainOfInfluenceTree?: DomainOfInfluence[];
}

export interface DecreeEditDialogResult {
  decree: Decree;
}

export interface EnumItemDescriptionWithDisabled<T> {
  value: T;
  description: string;
  disabled: boolean;
}

export interface Form {
  description: FormControl<string>;
  collectionStartDate: FormControl<Date | undefined>;
  collectionEndDate: FormControl<Date | undefined>;
  minSignatureCount: FormControl<number>;
  maxElectronicSignatureCount: FormControl<number>;
  link: FormControl<string>;
}
