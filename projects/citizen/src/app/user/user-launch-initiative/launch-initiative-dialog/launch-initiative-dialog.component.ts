/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import {
  BaseDialogWithUnsavedChangesCheckComponent,
  DialogComponent,
  InitiativeSubType,
  isGrpcError,
  MunicipalityFilterComponent,
  ValidationMessagesProvider,
} from 'ecollecting-lib';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertBarModule,
  DropdownModule,
  ErrorModule,
  LabelModule,
  RadioButtonModule,
  ReadonlyModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { AsyncInputValidators, EnumItemDescription } from '@abraxas/voting-lib';
import { InitiativeService } from '../../../core/services/initiative.service';
import { DomainOfInfluenceService } from '../../../core/services/domain-of-influence.service';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { insufficientAcrException } from '../../../core/exceptions';
import { DomainOfInfluence } from '../../../core/models/domain-of-influence.model';

const initiativeNotFoundException = 'InitiativeNotFoundException';
const initiativeAlreadyInPreparationException = 'InitiativeAlreadyInPreparationException';
const initiativeAdmissibilityDecisionRejectedException = 'InitiativeAdmissibilityDecisionRejectedException';

@Component({
  selector: 'app-launch-initiative-dialog',
  templateUrl: './launch-initiative-dialog.component.html',
  styleUrls: ['./launch-initiative-dialog.component.scss'],
  imports: [
    DialogComponent,
    DropdownModule,
    TranslatePipe,
    ReactiveFormsModule,
    ReadonlyModule,
    TextModule,
    RadioButtonModule,
    LabelModule,
    MunicipalityFilterComponent,
    ErrorModule,
    KeyValuePipe,
    DecimalPipe,
    AlertBarModule,
  ],
})
export class LaunchInitiativeDialogComponent
  extends BaseDialogWithUnsavedChangesCheckComponent<void, LaunchInitiativeDialogResult>
  implements OnInit
{
  public readonly validationMessagesProvider = inject(ValidationMessagesProvider);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly initiativeService = inject(InitiativeService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);
  private readonly translate = inject(TranslateService);

  public readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  public saving: boolean = false;
  public form!: FormGroup<Form>;

  public domainOfInfluenceTypeItems: EnumItemDescription<DomainOfInfluenceType>[] = [];
  public subTypes: InitiativeSubType[] = [];
  public filteredSubTypes: InitiativeSubType[] = [];
  public domainOfInfluences: DomainOfInfluence[] = [];

  public isPaperSubmission: boolean = false;
  public isElectronicSubmission: boolean = false;
  public selectedDomainOfInfluence?: DomainOfInfluence;
  public error?: string;

  constructor() {
    super();
    this.buildForm();
  }

  public async ngOnInit(): Promise<void> {
    let doiTypes: DomainOfInfluenceType[];
    [doiTypes, this.subTypes, this.domainOfInfluences] = await Promise.all([
      this.domainOfInfluenceService.listTypes(),
      this.initiativeService.listSubTypes(),
      this.domainOfInfluenceService.list(true, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]),
    ]);

    this.domainOfInfluenceTypeItems = doiTypes.map(dt => ({
      value: dt,
      description: this.translate.instant('DOMAIN_OF_INFLUENCE_TYPES.' + dt),
    }));
    this.domainOfInfluences = this.domainOfInfluences.filter(x => x.eCollectingEnabled);
  }

  public async save(): Promise<void> {
    const values = this.form.value as Required<typeof this.form.value>;
    try {
      this.saving = true;

      const id = this.isElectronicSubmission
        ? await this.initiativeService.create(values.domainOfInfluenceType, values.description, values.subType?.id, values.bfs)
        : await this.initiativeService.setInPreparation(values.secureIdNumber);

      this.dialogRef.close({
        id: id,
      });
    } catch (e) {
      if (isGrpcError(e, initiativeNotFoundException)) {
        this.setErrorOnSecureIdNumber(initiativeNotFoundException);
      } else if (isGrpcError(e, initiativeAlreadyInPreparationException)) {
        this.setErrorOnSecureIdNumber(initiativeAlreadyInPreparationException);
      } else if (isGrpcError(e, initiativeAdmissibilityDecisionRejectedException)) {
        this.setErrorOnSecureIdNumber(initiativeAdmissibilityDecisionRejectedException);
      } else if (isGrpcError(e, insufficientAcrException)) {
        this.error = insufficientAcrException;
      } else {
        throw e;
      }
    } finally {
      this.saving = false;
    }
  }

  public updatePaperSubmissionValidators(): void {
    if (this.isPaperSubmission) {
      this.form.controls.secureIdNumber.enable();
      this.form.controls.secureIdNumber.setValidators([
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(12),
        Validators.pattern(/^[A-Z0-9]{12}$/),
      ]);
    } else {
      this.form.controls.secureIdNumber.disable();
      this.form.controls.secureIdNumber.clearValidators();
    }
    this.form.controls.secureIdNumber.updateValueAndValidity();
  }

  public updateElectronicSubmissionValidators(): void {
    if (this.isElectronicSubmission) {
      this.form.controls.domainOfInfluenceType.enable();
      this.form.controls.domainOfInfluenceType.setValidators([Validators.required]);
      this.form.controls.description.enable();
      this.form.controls.description.setValidators([Validators.required, Validators.maxLength(200)]);

      if (
        this.form.value.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH ||
        this.form.value.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT
      ) {
        this.form.controls.subType.enable();
        this.form.controls.subType.setValidators([Validators.required]);
      } else {
        this.form.controls.subType.disable();
        this.form.controls.subType.clearValidators();
      }

      if (this.form.value.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU) {
        this.form.controls.bfs.enable();
        this.form.controls.bfs.setValidators([Validators.required]);
      } else {
        this.form.controls.bfs.disable();
        this.form.controls.bfs.clearValidators();
      }
    } else {
      this.form.controls.domainOfInfluenceType.disable();
      this.form.controls.domainOfInfluenceType.clearValidators();
      this.form.controls.subType.disable();
      this.form.controls.subType.clearValidators();
      this.form.controls.bfs.disable();
      this.form.controls.bfs.clearValidators();
      this.form.controls.description.disable();
      this.form.controls.description.clearValidators();
    }
    this.form.controls.secureIdNumber.updateValueAndValidity();
  }

  public get selectedDomainOfInfluenceMaxElectronicSignatureCount(): string {
    if (!this.selectedDomainOfInfluence) {
      return '';
    }

    return Math.round(
      (this.selectedDomainOfInfluence.initiativeMinSignatureCount *
        this.selectedDomainOfInfluence.initiativeMaxElectronicSignaturePercent) /
        100,
    ).toString();
  }

  public domainOfInfluenceTypeChanged(domainOfInfluence: DomainOfInfluenceType): void {
    this.filteredSubTypes = this.subTypes.filter(x => x.domainOfInfluenceType === domainOfInfluence);
    this.form.controls.subType.patchValue(undefined);
  }

  protected override get hasChanges(): boolean {
    return this.form.valid;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      domainOfInfluenceType: this.formBuilder.control({ value: undefined, disabled: true }),
      subType: this.formBuilder.control({ value: undefined, disabled: true }),
      description: this.formBuilder.control(
        { value: '', disabled: true },
        {
          asyncValidators: [AsyncInputValidators.complexSlText],
        },
      ),
      secureIdNumber: this.formBuilder.control({ value: '', disabled: true }),
      bfs: this.formBuilder.control({ value: '', disabled: true }),
    });
  }

  private setErrorOnSecureIdNumber(errorType: string): void {
    const key = `ERROR_MESSAGES.${errorType}`;
    const message = this.translate.instant(key);
    const errors: any = {};
    errors[errorType] = message;
    this.form.controls.secureIdNumber.setErrors(errors);
  }
}

export interface LaunchInitiativeDialogResult {
  id: string;
}

export interface Form {
  domainOfInfluenceType: FormControl<DomainOfInfluenceType | undefined>;
  subType: FormControl<InitiativeSubType | undefined>;
  description: FormControl<string>;
  secureIdNumber: FormControl<string>;
  bfs: FormControl<string>;
}
