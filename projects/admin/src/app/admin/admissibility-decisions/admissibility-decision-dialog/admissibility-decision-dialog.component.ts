/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnInit } from '@angular/core';
import {
  BaseDialogWithUnsavedChangesCheckComponent,
  ConfirmDialogComponent,
  ConfirmDialogData,
  DeepRequired,
  DialogComponent,
  EnumItemDescriptionUtils,
  InitiativeSubType,
  ToastService,
} from 'ecollecting-lib';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AutocompleteModule,
  CheckboxModule,
  DropdownModule,
  IconButtonModule,
  ReadonlyModule,
  SpinnerModule,
  StatusLabelModule,
  TextareaModule,
  TextModule,
  TooltipModule,
} from '@abraxas/base-components';
import { CollectionState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { AsyncInputValidators, EnumItemDescription } from '@abraxas/voting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { InitiativeService } from '../../../core/services/initiative.service';
import { Initiative } from '../../../core/models/initiative.model';
import { AdmissibilityDecisionState } from '@abraxas/voting-ecollecting-proto/admin';
import { DomainOfInfluenceService } from '../../../core/services/domain-of-influence.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admissibility-decision-dialog',
  imports: [
    DialogComponent,
    ReactiveFormsModule,
    DropdownModule,
    TranslatePipe,
    AutocompleteModule,
    TextModule,
    TextareaModule,
    SpinnerModule,
    CheckboxModule,
    TooltipModule,
    IconButtonModule,
    ReadonlyModule,
    StatusLabelModule,
  ],
  templateUrl: './admissibility-decision-dialog.component.html',
  styleUrl: './admissibility-decision-dialog.component.scss',
})
export class AdmissibilityDecisionDialogComponent
  extends BaseDialogWithUnsavedChangesCheckComponent<AdmissibilityDecisionDialogComponent, AdmissibilityDecisionDialogResult>
  implements OnInit
{
  protected dialogData = inject<AdmissibilityDecisionDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly initiativeService = inject(InitiativeService);
  private readonly doiService = inject(DomainOfInfluenceService);
  private readonly toastService = inject(ToastService);

  protected saving: boolean = false;
  protected loading: boolean = true;
  protected form!: FormGroup<Form>;

  protected domainOfInfluenceTypes: EnumItemDescription<DomainOfInfluenceType>[];
  protected admissibilityDecisionStates: EnumItemDescription<AdmissibilityDecisionState>[];

  private subTypes: InitiativeSubType[] = [];
  protected filteredSubTypes: InitiativeSubType[] = [];

  // flatten description, bc component can only access direct members and not collection.description
  protected initiatives: (Initiative & { description: string })[] = [];

  protected hasSubType: boolean = false;
  protected hasInitiative: boolean = false;
  protected selectedInitiativeState?: CollectionState;

  protected readonly canEditInitiative: boolean;
  protected canEditGeneralInformation: boolean;
  protected readonly canEditAdmissibilityDecision: boolean;
  protected canEditAdmissibilityDecisionState: boolean = true;
  protected canEditGovernmentDecisionNumber: boolean = true;

  protected isWordingRequired: boolean = false;
  protected isAddressRequired: boolean = false;

  protected readonly isNew: boolean;

  constructor() {
    super();
    const enumItemDescriptionUtils = inject(EnumItemDescriptionUtils);

    this.isNew = this.dialogData.initiative === undefined;
    this.hasInitiative = !this.isNew;

    this.canEditAdmissibilityDecision = this.dialogData.initiative?.collection?.userPermissions?.canEditAdmissibilityDecision !== false;
    this.canEditGeneralInformation = this.dialogData.initiative?.collection?.userPermissions?.canEditGeneralInformation !== false;
    this.canEditInitiative = !this.hasInitiative;
    this.canEditAdmissibilityDecisionState = this.canEditAdmissibilityDecision;
    this.canEditGovernmentDecisionNumber = this.canEditAdmissibilityDecision;

    this.domainOfInfluenceTypes = enumItemDescriptionUtils.getArrayWithDescriptions<DomainOfInfluenceType>(
      DomainOfInfluenceType,
      'DOMAIN_OF_INFLUENCE.TYPES.',
    );
    this.admissibilityDecisionStates = enumItemDescriptionUtils.getArrayWithDescriptions<AdmissibilityDecisionState>(
      AdmissibilityDecisionState,
      'ADMISSIBILITY_DECISION_STATES.',
    );
    this.buildForm();
  }

  public override get hasChanges(): boolean {
    return this.form.dirty && this.form.touched;
  }

  public async ngOnInit(): Promise<void> {
    try {
      this.loading = true;
      this.subTypes = await this.initiativeService.listSubTypes();

      const ownDoiTypes = await this.doiService.listOwnTypes();
      this.domainOfInfluenceTypes = this.domainOfInfluenceTypes.filter(x => ownDoiTypes.includes(x.value));

      if (this.dialogData.initiative === undefined) {
        this.initiatives = (await this.initiativeService.listEligibleForAdmissibilityDecision()).map(i => ({
          ...i,
          description: i.collection.description,
        }));

        if (ownDoiTypes.length === 1) {
          this.form.patchValue({
            domainOfInfluenceType: ownDoiTypes[0],
          });
        }

        return;
      }

      this.canEditGovernmentDecisionNumber =
        this.dialogData.initiative.collection.userPermissions?.canEditAdmissibilityDecision !== false &&
        (!this.dialogData.initiative.admissibilityDecisionState ||
          this.dialogData.initiative.admissibilityDecisionState === AdmissibilityDecisionState.ADMISSIBILITY_DECISION_STATE_OPEN);

      if (!this.canEditGovernmentDecisionNumber) {
        this.form.controls.admissibilityDecisionState.addValidators(x =>
          x.value === AdmissibilityDecisionState.ADMISSIBILITY_DECISION_STATE_OPEN
            ? { admissibilityDecisionState: 'Cannot set open state' }
            : null,
        );
      }

      this.initiatives = [
        {
          ...this.dialogData.initiative,
          description: this.dialogData.initiative.collection.description,
        },
      ];
      this.form.patchValue({
        initiativeId: this.dialogData.initiative.id,
        wording: this.dialogData.initiative.wording,
        address: {
          locality: this.dialogData.initiative.collection.address?.locality ?? '',
          zipCode: this.dialogData.initiative.collection.address?.zipCode ?? '',
          streetOrPostOfficeBox: this.dialogData.initiative.collection.address?.streetOrPostOfficeBox ?? '',
          committeeOrPerson: this.dialogData.initiative.collection.address?.committeeOrPerson ?? '',
        },
        subType:
          this.dialogData.initiative!.subType === undefined
            ? undefined
            : this.subTypes.find(s => s.id === this.dialogData.initiative!.subType?.id),
        description: this.dialogData.initiative.collection.description,
        admissibilityDecisionState: this.dialogData.initiative.admissibilityDecisionState,
        domainOfInfluenceType: this.dialogData.initiative.domainOfInfluenceType,
        governmentDecisionNumber: this.dialogData.initiative.governmentDecisionNumber,
      });
      this.setDoiType();
      this.selectedInitiativeState = this.dialogData.initiative.collection.state;
    } finally {
      this.loading = false;
    }
  }

  protected async save(): Promise<void> {
    this.saving = true;
    try {
      const values = this.form.value as DeepRequired<typeof this.form.value>;
      if (this.hasInitiative && this.isNew) {
        await this.initiativeService.createLinkedAdmissibilityDecision(
          values.initiativeId,
          values.admissibilityDecisionState,
          values.governmentDecisionNumber,
        );
        await this.closeSaved(values.initiativeId);
        return;
      }

      if (this.hasInitiative) {
        if (this.canEditGeneralInformation) {
          await this.initiativeService.update({
            ...values,
            subTypeId: values.subType?.id,
            id: this.dialogData.initiative!.id,
          });
        }

        if (this.canEditAdmissibilityDecision) {
          if (
            this.dialogData.initiative?.admissibilityDecisionState !== values.admissibilityDecisionState &&
            !this.canEditGeneralInformation
          ) {
            const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
              title: 'ADMIN.ADMISSIBILITY_DECISIONS.EDIT_DIALOG.CONFIRM_ADMISSIBILITY_DECISION_STATE.TITLE',
              message:
                'ADMIN.ADMISSIBILITY_DECISIONS.EDIT_DIALOG.CONFIRM_ADMISSIBILITY_DECISION_STATE.' + values.admissibilityDecisionState,
              confirmText: 'APP.YES',
              discardText: 'APP.DISCARD',
            } satisfies ConfirmDialogData);

            if (!(await firstValueFrom(dialogRef.afterClosed()))) {
              return;
            }
          }

          await this.initiativeService.updateAdmissibilityDecision(
            values.initiativeId,
            values.admissibilityDecisionState,
            values.governmentDecisionNumber,
          );
        }

        await this.closeSaved(values.initiativeId);
        return;
      }

      const id = await this.initiativeService.createWithAdmissibilityDecision({
        ...values,
        subTypeId: values.subType?.id,
      });
      await this.closeSaved(id);
    } finally {
      this.saving = false;
    }
  }

  protected selectInitiative(): void {
    if (!this.isNew) {
      return;
    }

    this.hasInitiative = !!this.form.value.initiativeId;
    this.canEditGeneralInformation = !this.hasInitiative;
    const initiative = this.initiatives.find(x => x.id === this.form.value.initiativeId);
    this.form.patchValue({
      domainOfInfluenceType: initiative?.domainOfInfluenceType,
      address: initiative?.collection?.address ?? {
        committeeOrPerson: '',
        locality: '',
        zipCode: '',
        streetOrPostOfficeBox: '',
      },
      wording: initiative?.wording,
      description: initiative?.description,
      subType: this.subTypes.find(s => s.id === initiative?.subType?.id),
    });
    this.selectDoiType();
    this.selectedInitiativeState = initiative ? initiative.collection.state : undefined;
  }

  protected selectDoiType(): void {
    if (!this.isNew) {
      return;
    }
    const isFederal = this.setDoiType();

    this.form.patchValue({
      admissibilityDecisionState: isFederal ? AdmissibilityDecisionState.ADMISSIBILITY_DECISION_STATE_VALID : undefined,
      subType: this.filteredSubTypes[0],
    });
  }

  private setDoiType(): boolean {
    this.hasSubType = this.form.value.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT;

    const isFederal = this.form.value.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH;
    this.isAddressRequired = !isFederal;
    this.isWordingRequired = !isFederal;

    this.setFormControlRequired(this.form.controls.address.controls.committeeOrPerson, this.isAddressRequired);
    this.setFormControlRequired(this.form.controls.address.controls.streetOrPostOfficeBox, this.isAddressRequired);
    this.setFormControlRequired(this.form.controls.address.controls.zipCode, this.isAddressRequired);
    this.setFormControlRequired(this.form.controls.address.controls.locality, this.isAddressRequired);
    this.setFormControlRequired(this.form.controls.wording, this.isWordingRequired);

    this.filteredSubTypes = this.subTypes.filter(s => s.domainOfInfluenceType == this.form.value.domainOfInfluenceType);
    return isFederal;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      domainOfInfluenceType: this.formBuilder.control(undefined, {
        validators: [Validators.required],
      }),
      initiativeId: this.formBuilder.control(undefined),
      governmentDecisionNumber: this.formBuilder.control('', {
        validators: [Validators.maxLength(50), Validators.required],
        asyncValidators: [AsyncInputValidators.simpleSlText],
      }),
      admissibilityDecisionState: this.formBuilder.control(undefined, {
        validators: [Validators.required],
      }),
      address: this.formBuilder.group({
        committeeOrPerson: this.formBuilder.control('', {
          validators: [Validators.maxLength(100)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        streetOrPostOfficeBox: this.formBuilder.control('', {
          validators: [Validators.maxLength(150)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        zipCode: this.formBuilder.control('', {
          validators: [Validators.maxLength(15)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        locality: this.formBuilder.control('', {
          validators: [Validators.maxLength(150)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
      }),
      subType: this.formBuilder.control(undefined),
      description: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      wording: this.formBuilder.control('', {
        validators: [Validators.maxLength(10_000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
    });
  }

  private setFormControlRequired(control: FormControl, required: boolean): void {
    if (required) {
      control.addValidators(Validators.required);
    } else {
      control.removeValidators(Validators.required);
    }

    control.updateValueAndValidity();
  }

  private async closeSaved(id: string): Promise<void> {
    const initiative = await this.initiativeService.get(id);
    this.dialogRef.close({ initiative });
    this.toastService.saved();
  }
}

export interface AdmissibilityDecisionDialogData {
  initiative?: Initiative;
}

export interface AdmissibilityDecisionDialogResult {
  initiative?: Initiative;
}

interface Form {
  domainOfInfluenceType: FormControl<DomainOfInfluenceType | undefined>;
  initiativeId: FormControl<string | undefined>;
  governmentDecisionNumber: FormControl<string>;
  admissibilityDecisionState: FormControl<AdmissibilityDecisionState | undefined>;
  address: FormGroup<FormAddress>;
  subType: FormControl<InitiativeSubType | undefined>;
  description: FormControl<string>;
  wording: FormControl<string>;
}

export interface FormAddress {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}
