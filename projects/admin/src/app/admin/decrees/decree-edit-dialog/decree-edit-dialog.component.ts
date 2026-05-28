/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Decree, newDecree } from '../../../core/models/decree.model';
import {
  BaseDialogWithUnsavedChangesCheckComponent,
  DialogComponent,
  EnumItemDescriptionUtils,
  getDate,
  ToastService,
} from 'ecollecting-lib';
import { DecreeService } from '../../../core/services/decree.service';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { Component, inject, OnInit } from '@angular/core';
import {
  DateModule,
  DialogService,
  DropdownModule,
  ErrorModule,
  IconButtonModule,
  IconModule,
  LinkModule,
  NumberModule,
  TextareaModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { AsyncInputValidators, EnumItemDescription, InputValidators } from '@abraxas/voting-lib';
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
import { DomainOfInfluenceService } from '../../../core/services/domain-of-influence.service';

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
    LinkModule,
  ],
  providers: [DecreeService, DialogService],
})
export class DecreeEditDialogComponent
  extends BaseDialogWithUnsavedChangesCheckComponent<DecreeEditDialogData, DecreeEditDialogResult>
  implements OnInit
{
  private readonly decreeService = inject(DecreeService);
  private readonly doiService = inject(DomainOfInfluenceService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly enumItemDescriptionUtils = inject(EnumItemDescriptionUtils);

  public readonly now: Date;
  public readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  public decree: Decree = newDecree();
  public domainOfInfluenceTypeItems: EnumItemDescription<DomainOfInfluenceType>[] = [];
  public domainOfInfluenceTree: DomainOfInfluence[] = [];
  public selectedDomainOfInfluence: DomainOfInfluence | undefined;
  public originalDecree: Decree;
  public isNew: boolean = true;
  public hasDataChanged: boolean = false;
  public saving: boolean = false;
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

    this.domainOfInfluenceTypeItems = this.enumItemDescriptionUtils.getArrayWithDescriptions<DomainOfInfluenceType>(
      DomainOfInfluenceType,
      'DOMAIN_OF_INFLUENCE.TYPES.',
    );

    this.buildForm();
  }
  public async ngOnInit(): Promise<void> {
    const ownDoiTypes = await this.doiService.listOwnTypes();
    this.domainOfInfluenceTypeItems = this.domainOfInfluenceTypeItems.filter(x => ownDoiTypes.includes(x.value));

    if (ownDoiTypes.length === 1 && this.isNew) {
      this.changeDomainOfInfluenceType(ownDoiTypes[0]);
      this.originalDecree.domainOfInfluenceType = this.decree.domainOfInfluenceType;
      this.originalDecree.domainOfInfluenceName = this.decree.domainOfInfluenceName;
    } else if (this.isNew) {
      this.decree.electronicCollectionEnabled = this.domainOfInfluenceTree.every(x => x.eCollectingEnabled);
    }

    this.hasDataChanged = false;
  }

  public get canSave(): boolean {
    return (
      this.form.valid &&
      this.decree.domainOfInfluenceType !== DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED &&
      this.hasDataChanged
    );
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
      this.decree.minSignatureCount = this.selectedDomainOfInfluence.settings.referendumMinSignatureCount ?? 0;
      this.decree.maxElectronicSignatureCount = this.calculateMaxSignatureCount(
        this.selectedDomainOfInfluence.settings.referendumMaxElectronicSignaturePercent ?? 0,
      );
      this.decree.bfs = this.selectedDomainOfInfluence.bfs;
      this.decree.electronicCollectionEnabled = this.selectedDomainOfInfluence.eCollectingEnabled;
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
        this.selectedDomainOfInfluence.settings.referendumMaxElectronicSignaturePercent ?? 0,
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

  private collectionEndDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      let date = getDate(value, 0, 0);

      if (date && date < this.now) {
        return { dateNotInFuture: true };
      } else if (date && this.decree.collectionStartDate && date <= this.decree.collectionStartDate) {
        return { dateNotOlderThanStartDate: true };
      }
      return null;
    };
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      description: this.formBuilder.control(this.decree.description, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(1000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
      collectionStartDate: this.formBuilder.control(this.decree.collectionStartDate, {
        validators: [Validators.required],
      }),
      collectionEndDate: this.formBuilder.control(this.decree.collectionEndDate, {
        validators: [Validators.required, this.collectionEndDateValidator()],
      }),
      minSignatureCount: this.formBuilder.control(this.decree.minSignatureCount),
      maxElectronicSignatureCount: this.formBuilder.control(this.decree.maxElectronicSignatureCount),
      link: this.formBuilder.control(this.decree.link, {
        validators: [Validators.minLength(1), Validators.maxLength(2000), InputValidators.httpsUrl],
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

export interface Form {
  description: FormControl<string>;
  collectionStartDate: FormControl<Date | undefined>;
  collectionEndDate: FormControl<Date | undefined>;
  minSignatureCount: FormControl<number>;
  maxElectronicSignatureCount: FormControl<number>;
  link: FormControl<string>;
}
