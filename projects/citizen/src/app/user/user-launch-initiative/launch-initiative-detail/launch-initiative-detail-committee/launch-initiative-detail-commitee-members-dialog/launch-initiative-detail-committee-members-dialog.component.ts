/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, ViewChild } from '@angular/core';
import {
  BaseDialogWithUnsavedChangesCheckComponent,
  DialogComponent,
  DomainOfInfluence,
  EnumItemDescriptionUtils,
  ToastService,
} from 'ecollecting-lib';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncInputValidators, VotingLibModule } from '@abraxas/voting-lib';
import {
  AutocompleteModule,
  ButtonModule,
  DateModule,
  RadioButton,
  RadioButtonModule,
  TextComponent,
  TextModule,
} from '@abraxas/base-components';
import {
  CollectionPermissionRole,
  InitiativeCommitteeMemberApprovalState,
  InitiativeCommitteeMemberSignatureType,
} from '@abraxas/voting-ecollecting-proto';
import { Initiative, InitiativeCommitteeMember } from '../../../../../core/models/initiative.model';
import { MatHint } from '@angular/material/form-field';
import { InitiativeService } from '../../../../../core/services/initiative.service';

@Component({
  selector: 'app-launch-initiative-detail-commitee-members-dialog',
  imports: [
    DialogComponent,
    TranslatePipe,
    TextModule,
    ReactiveFormsModule,
    DateModule,
    RadioButtonModule,
    MatHint,
    ButtonModule,
    VotingLibModule,
    AutocompleteModule,
  ],
  templateUrl: './launch-initiative-detail-committee-members-dialog.component.html',
  styleUrl: './launch-initiative-detail-committee-members-dialog.component.scss',
})
export class LaunchInitiativeDetailCommitteeMembersDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<LaunchInitiativeDetailCommitteeMembersDialogData> {
  protected readonly dialogData = inject<LaunchInitiativeDetailCommitteeMembersDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly initiativeService = inject(InitiativeService);
  private readonly toast = inject(ToastService);

  protected saving = false;
  protected savingAndClose = false;
  protected readonly = false;
  protected editing = false;

  @ViewChild('firstName')
  protected firstNameInput!: TextComponent;

  protected form!: FormGroup<Form>;
  protected readonly roleChoices: RadioButton[];
  protected readonly requestMemberSignatureChoices: RadioButton[];
  protected selectedDomainOfInfluence?: DomainOfInfluence;

  constructor() {
    super();
    const enumItemDescriptionUtils = inject(EnumItemDescriptionUtils);
    const i18n = inject(TranslateService);

    this.roleChoices = enumItemDescriptionUtils
      .getArrayWithDescriptionsWithUnspecified<CollectionPermissionRole>(CollectionPermissionRole, 'COLLECTION_PERMISSION_ROLES.')
      .filter(x => x.value !== CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_OWNER)
      .map(item => ({
        value: item.value,
        displayText: item.description,
      }));

    this.requestMemberSignatureChoices = [false, true]
      .filter(x => this.dialogData.initiative.collection.isElectronicSubmission || !x)
      .map(item => ({
        value: item,
        displayText: i18n.instant(
          'LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.REQUEST_MEMBER_SIGNATURE.' + (item ? 'REQUEST' : 'NO_REQUEST'),
        ),
      }));

    this.buildForm();

    this.readonly = !this.dialogData.initiative.collection.userPermissions?.canEdit;

    if (this.dialogData.member) {
      this.editing = true;
      this.readonly ||= !this.dialogData.member.canEdit;

      const residence = this.dialogData.domainOfInfluences?.find(d => d.bfs === this.dialogData.member!.bfs);
      const politicalResidence = this.dialogData.domainOfInfluences?.find(d => d.bfs === this.dialogData.member!.politicalBfs);

      this.form.patchValue({
        role: this.dialogData.member.role,
        firstName: this.dialogData.member.firstName,
        politicalFirstName: this.dialogData.member.politicalFirstName,
        lastName: this.dialogData.member.lastName,
        politicalLastName: this.dialogData.member.politicalLastName,
        email: this.dialogData.member.email,
        dateOfBirth: this.dialogData.member.dateOfBirth,
        residence,
        politicalResidence,
        politicalDuty: this.dialogData.member.politicalDuty,
        requestMemberSignature: this.dialogData.member.memberSignatureRequested,
      });
    }
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
  }

  public async save(close: boolean): Promise<void> {
    if (close) {
      this.savingAndClose = true;
    } else {
      this.saving = true;
    }

    try {
      const values = this.form.value as Required<typeof this.form.value>;
      values.dateOfBirth = new Date(values.dateOfBirth);
      this.enrichPoliticalValues(values);

      if (this.editing) {
        await this.updateCommitteeMember(values);
      } else {
        await this.addCommitteeMember(values);
      }

      this.toast.success('LAUNCH_INITIATIVE.DETAIL.COMMITTEE.MEMBERS.ADD_DIALOG.SAVED');

      if (close) {
        this.dialogRef.close();
      } else {
        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.form.updateValueAndValidity();
        this.firstNameInput.setFocus();
        delete this.selectedDomainOfInfluence;
      }
    } finally {
      this.savingAndClose = false;
      this.saving = false;
    }
  }

  public selectDoi(bfs: string): void {
    const doi = this.dialogData.domainOfInfluences?.find(d => d.bfs === bfs);
    if (doi && doi !== this.selectedDomainOfInfluence) {
      this.selectedDomainOfInfluence = doi;
    }
  }

  private async addCommitteeMember(values: Required<typeof this.form.value>): Promise<void> {
    const id = await this.initiativeService.addCommitteeMember(this.dialogData.initiative.id, {
      ...values,
      bfs: values.residence.bfs,
      politicalBfs: values.politicalResidence.bfs,
    });
    const residence = this.dialogData.domainOfInfluences?.find(d => d.bfs === values.residence.bfs)?.name ?? '';
    const politicalResidence = this.dialogData.domainOfInfluences?.find(d => d.bfs === values.politicalResidence.bfs)?.name ?? '';
    const newMember: InitiativeCommitteeMember = {
      id,
      ...values,
      memberSignatureRequested: values.requestMemberSignature,
      approvalState: values.requestMemberSignature
        ? InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED
        : InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED,
      signatureType: values.requestMemberSignature
        ? InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UNSPECIFIED
        : InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UPLOADED_SIGNATURE,
      canEdit: true,
      bfs: values.residence.bfs,
      politicalBfs: values.politicalResidence.bfs,
      residence,
      politicalResidence,
    };
    this.dialogData.onSave(newMember);
  }

  private async updateCommitteeMember(values: Required<typeof this.form.value>): Promise<void> {
    await this.initiativeService.updateCommitteeMember({
      ...values,
      initiativeId: this.dialogData.initiative.id,
      id: this.dialogData.member!.id,
      bfs: values.residence.bfs,
      politicalBfs: values.politicalResidence.bfs,
    });
    Object.assign(this.dialogData.member!, values);
    this.dialogData.member!.memberSignatureRequested = values.requestMemberSignature;
    this.dialogData.member!.approvalState = values.requestMemberSignature
      ? InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED
      : InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_SIGNED;
    this.dialogData.member!.signatureType = values.requestMemberSignature
      ? InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UNSPECIFIED
      : InitiativeCommitteeMemberSignatureType.INITIATIVE_COMMITTEE_MEMBER_SIGNATURE_TYPE_UPLOADED_SIGNATURE;
    this.dialogData.member!.canEdit = true;
    this.dialogData.member!.bfs = values.residence.bfs;
    this.dialogData.member!.residence = values.residence.name;
    this.dialogData.member!.politicalBfs = values.politicalResidence.bfs;
    this.dialogData.member!.politicalResidence = values.politicalResidence.name;
    this.dialogData.onSave(this.dialogData.member!);
  }

  private enrichPoliticalValues(values: Required<typeof this.form.value>): void {
    if (!values.politicalFirstName) {
      values.politicalFirstName = values.firstName;
    }

    if (!values.politicalLastName) {
      values.politicalLastName = values.lastName;
    }

    if (!values.politicalResidence) {
      values.politicalResidence = values.residence;
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      lastName: this.formBuilder.control('', {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      firstName: this.formBuilder.control('', {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      politicalLastName: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      politicalFirstName: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      dateOfBirth: this.formBuilder.control(null!, {
        validators: [Validators.required],
      }),
      residence: this.formBuilder.control(undefined, {
        validators: [Validators.required],
      }),
      politicalResidence: this.formBuilder.control(undefined),
      email: this.formBuilder.control('', {
        validators: [Validators.email],
      }),
      politicalDuty: this.formBuilder.control('', {
        validators: [Validators.maxLength(50)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      role: this.formBuilder.control(CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_UNSPECIFIED),
      requestMemberSignature: this.formBuilder.control(this.dialogData.initiative.collection.isElectronicSubmission),
    });
  }
}

export interface LaunchInitiativeDetailCommitteeMembersDialogData {
  initiative: Initiative;
  member?: InitiativeCommitteeMember;
  domainOfInfluences: DomainOfInfluence[];
  onSave: (member: InitiativeCommitteeMember) => void;
}

interface Form {
  lastName: FormControl<string>;
  firstName: FormControl<string>;
  politicalLastName: FormControl<string>;
  politicalFirstName: FormControl<string>;
  dateOfBirth: FormControl<Date>;
  residence: FormControl<DomainOfInfluence | undefined>;
  politicalResidence: FormControl<DomainOfInfluence | undefined>;
  email: FormControl<string>;
  politicalDuty: FormControl<string>;
  role: FormControl<CollectionPermissionRole>;
  requestMemberSignature: FormControl<boolean>;
}
