/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { DomainOfInfluence } from '../../../core/models/domain-of-influence.model';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DomainOfInfluenceService,
  DomainOfInfluenceCollectionSettings,
  UpdateDomainOfInfluenceRequest,
} from '../../../core/services/domain-of-influence.service';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import {
  ButtonModule,
  DialogService,
  ExpansionPanelModule,
  IconButtonModule,
  IconModule,
  NumberModule,
  SpinnerModule,
  TextModule,
} from '@abraxas/base-components';
import { SecondFactorTransactionService, VotingLibModule } from '@abraxas/voting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, filter, merge, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FileChipComponent, ImageUploadComponent, ToastService } from 'ecollecting-lib';

@Component({
  selector: 'app-domain-of-influence-settings',
  imports: [
    TextModule,
    TranslatePipe,
    ImageUploadComponent,
    ReactiveFormsModule,
    ExpansionPanelModule,
    IconModule,
    SpinnerModule,
    NumberModule,
    ButtonModule,
    FileChipComponent,
    IconButtonModule,
    VotingLibModule,
  ],
  providers: [DialogService],
  templateUrl: './domain-of-influence-settings.component.html',
  styleUrl: './domain-of-influence-settings.component.scss',
})
export class DomainOfInfluenceSettingsComponent implements OnChanges, OnDestroy {
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);
  private readonly secondFactorTransactionService = inject(SecondFactorTransactionService);

  @Input({ required: true })
  public domainOfInfluence!: DomainOfInfluence;

  @Output()
  public statusMessageChange: EventEmitter<'saving' | 'saved' | undefined> = new EventEmitter<'saving' | 'saved' | undefined>();

  protected readonly form: FormGroup<Form> = this.buildForm();
  protected readonly collectionForm: FormGroup<CollectionForm> = this.buildCollectionForm();
  protected collectionEditMode: boolean = false;
  protected collectionPanelExpanded: boolean = false;
  protected savingCollectionSettings: boolean = false;
  protected logo?: File;
  protected logoError: boolean = false;
  protected logoLoading: boolean = false;
  protected isSwitchingDoi: boolean = false;
  protected readonly emailToAddControl = new FormControl<string>('', {
    validators: [Validators.email],
    nonNullable: true,
  });

  protected readonly DomainOfInfluenceType = DomainOfInfluenceType;
  private showValidationErrorsValue: boolean = false;

  private formSubscription?: Subscription;

  public get hasUnsavedChanges(): boolean {
    // valid changes are autosaved, so only consider invalid changes as unsaved changes
    return this.domainOfInfluence?.userPermissions?.canEdit && this.form.dirty && !this.form.valid;
  }

  public get showValidationErrors(): boolean {
    return this.showValidationErrorsValue;
  }

  public set showValidationErrors(value: boolean) {
    this.showValidationErrorsValue = value;

    if (value) {
      this.form.markAllAsTouched();
    }
  }

  public async ngOnChanges(changes: SimpleChanges): Promise<void> {
    this.isSwitchingDoi = true;
    try {
      const previousDomainOfInfluence = changes['domainOfInfluence']?.previousValue as DomainOfInfluence | undefined;
      if (previousDomainOfInfluence && this.form.dirty && previousDomainOfInfluence.userPermissions.canEdit) {
        await this.save(previousDomainOfInfluence, false);
      }

      this.formSubscription?.unsubscribe();
      this.statusMessageChange.emit();
      this.updateValidators();
      this.emailToAddControl.reset();
      this.emailToAddControl.markAsUntouched();
      this.form.reset(
        {
          ...this.domainOfInfluence.address,
          ...this.domainOfInfluence.settings,
          ...this.domainOfInfluence,
          addressName: this.domainOfInfluence.address?.name ?? this.domainOfInfluence.name,
        },
        { emitEvent: false },
      );
      this.resetCollectionForm();
      await this.loadLogo();

      if (this.domainOfInfluence.userPermissions.canEdit) {
        this.form.enable();
      } else {
        this.form.disable();
      }

      this.formSubscription = merge(
        this.form.valueChanges.pipe(
          tap(() => this.statusMessageChange.emit()),
          filter(() => this.form.valid && this.form.dirty),
        ),
        this.form.statusChanges.pipe(
          distinctUntilChanged(),
          filter(x => x === 'VALID' && this.form.dirty),
        ),
      )
        .pipe(debounceTime(200))
        .subscribe(() => this.save(this.domainOfInfluence));
    } finally {
      this.isSwitchingDoi = false;
    }
  }

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    void this.saveIfEditedAndValid();
    return !this.hasUnsavedChanges;
  }

  public async ngOnDestroy(): Promise<void> {
    this.formSubscription?.unsubscribe();
    await this.saveIfEditedAndValid();
  }

  protected async save(domainOfInfluence: DomainOfInfluence, setStatusLabel: boolean = true): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    try {
      if (setStatusLabel) {
        this.statusMessageChange.emit('saving');
      }

      this.form.markAsUntouched();

      const formValue = this.form.value as Required<typeof this.form.value>;
      const value = {
        ...formValue,
        bfs: domainOfInfluence.bfs,
      } satisfies UpdateDomainOfInfluenceRequest;
      await this.domainOfInfluenceService.update(value);
      Object.assign(domainOfInfluence, value);

      domainOfInfluence.address ??= { name: value.addressName, ...value };
      Object.assign(domainOfInfluence.address, value);
      domainOfInfluence.address.name = value.addressName;

      if (setStatusLabel) {
        this.statusMessageChange.emit('saved');
      }
    } catch (e) {
      if (setStatusLabel) {
        this.statusMessageChange.emit();
      }

      throw e;
    }
  }

  protected startEditCollectionSettings(): void {
    if (!this.domainOfInfluence.userPermissions.canEdit) {
      return;
    }

    this.collectionEditMode = true;
  }

  protected cancelEditCollectionSettings(): void {
    this.collectionEditMode = false;
    this.resetCollectionForm();
  }

  protected async saveCollectionSettings(): Promise<void> {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      return;
    }

    if (!this.collectionForm.dirty) {
      this.cancelEditCollectionSettings();
      return;
    }

    this.savingCollectionSettings = true;
    try {
      const settings = this.buildCollectionSettings();
      const transaction = await this.domainOfInfluenceService.prepareUpdateCollectionSettings(this.domainOfInfluence.bfs, settings);
      await this.secondFactorTransactionService.showDialogAndExecuteVerifyAction(
        otpCode => this.domainOfInfluenceService.updateCollectionSettings(this.domainOfInfluence.bfs, settings, transaction.id, otpCode),
        transaction.nevis,
        transaction.availableProviders,
      );

      this.domainOfInfluence.settings ??= {} as any;
      Object.assign(this.domainOfInfluence.settings, settings);
      this.collectionForm.markAsPristine();
      this.collectionEditMode = false;
      this.toast.success('ADMIN.DOMAIN_OF_INFLUENCE_SETTINGS.COLLECTION_SETTINGS.SAVED');
    } finally {
      this.savingCollectionSettings = false;
    }
  }

  protected async addEmail(): Promise<void> {
    if (this.emailToAddControl.invalid) {
      return;
    }

    const email = this.emailToAddControl.value.trim();
    if (!email) {
      return;
    }

    const currentEmails = this.form.controls.notificationEmails.value;

    let shouldSave = false;
    if (!currentEmails.includes(email)) {
      this.form.controls.notificationEmails.setValue([...currentEmails, email]);
      this.form.controls.notificationEmails.markAsDirty();
      shouldSave = true;
    }

    this.emailToAddControl.reset();
    this.emailToAddControl.updateValueAndValidity();
    this.emailToAddControl.markAsUntouched();

    if (shouldSave) {
      await this.saveIfEditedAndValid();
    }
  }

  protected async removeEmail(email: string): Promise<void> {
    const currentEmails = this.form.controls.notificationEmails.value;
    this.form.controls.notificationEmails.setValue(currentEmails.filter(e => e !== email));
    this.form.controls.notificationEmails.markAsDirty();
    await this.saveIfEditedAndValid();
  }

  public async updateLogo(file?: File): Promise<void> {
    if (!file) {
      return;
    }

    try {
      this.logoError = false;
      this.logoLoading = true;
      this.domainOfInfluence.logo = { id: '', name: file.name };
      await this.domainOfInfluenceService.updateLogo(this.domainOfInfluence.bfs, file);
      this.logo = file;
      this.toast.success('ADMIN.DOMAIN_OF_INFLUENCE_SETTINGS.LOGO.SAVED');
    } catch (e) {
      this.logoError = true;
      throw e;
    } finally {
      this.logoLoading = false;
    }
  }

  public async deleteLogo(): Promise<void> {
    if (!this.logo) {
      return;
    }

    delete this.logo;
    await this.domainOfInfluenceService.deleteLogo(this.domainOfInfluence.bfs);
    this.toast.success('ADMIN.DOMAIN_OF_INFLUENCE_SETTINGS.LOGO.REMOVED');
  }

  private async loadLogo(): Promise<void> {
    if (!this.domainOfInfluence.logo) {
      delete this.logo;
      return;
    }

    const blob = await this.domainOfInfluenceService.getLogo(this.domainOfInfluence.bfs);
    this.logo = new File([blob], this.domainOfInfluence.logo.name, { type: blob.type });
  }

  private updateValidators(): void {
    const controls = this.collectionForm.controls;

    controls.initiativeMinSignatureCount.setValidators([Validators.min(0)]);
    controls.initiativeMaxElectronicSignaturePercent.setValidators([Validators.min(0), Validators.max(100)]);
    controls.referendumMinSignatureCount.setValidators([Validators.min(0)]);
    controls.referendumMaxElectronicSignaturePercent.setValidators([Validators.min(0), Validators.max(100)]);

    switch (this.domainOfInfluence.type) {
      case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU:
        controls.initiativeMinSignatureCount.addValidators(Validators.required);
        controls.referendumMinSignatureCount.addValidators(Validators.required);
        break;
      case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT:
        controls.initiativeMaxElectronicSignaturePercent.addValidators(Validators.required);
        controls.referendumMaxElectronicSignaturePercent.addValidators(Validators.required);
        controls.referendumMinSignatureCount.addValidators(Validators.required);
        break;
      case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH:
        controls.referendumMaxElectronicSignaturePercent.addValidators(Validators.required);
        controls.referendumMinSignatureCount.addValidators(Validators.required);
        break;
    }

    controls.initiativeMinSignatureCount.updateValueAndValidity();
    controls.initiativeMaxElectronicSignaturePercent.updateValueAndValidity();
    controls.referendumMinSignatureCount.updateValueAndValidity();
    controls.referendumMaxElectronicSignaturePercent.updateValueAndValidity();
  }

  private resetCollectionForm(): void {
    this.collectionEditMode = false;
    this.collectionForm.reset({ ...this.domainOfInfluence.settings }, { emitEvent: false });
    this.collectionForm.markAsPristine();
    this.collectionForm.markAsUntouched();
  }

  private buildCollectionSettings(): DomainOfInfluenceCollectionSettings {
    const value = this.collectionForm.value;
    switch (this.domainOfInfluence.type) {
      case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU:
        return {
          initiativeMinSignatureCount: value.initiativeMinSignatureCount,
          referendumMinSignatureCount: value.referendumMinSignatureCount,
          initiativeNumberOfMembersCommittee: value.initiativeNumberOfMembersCommittee,
        };
      case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT:
        return {
          initiativeMaxElectronicSignaturePercent: value.initiativeMaxElectronicSignaturePercent,
          referendumMinSignatureCount: value.referendumMinSignatureCount,
          referendumMaxElectronicSignaturePercent: value.referendumMaxElectronicSignaturePercent,
          initiativeNumberOfMembersCommittee: value.initiativeNumberOfMembersCommittee,
        };
      case DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH:
        return {
          referendumMinSignatureCount: value.referendumMinSignatureCount,
          referendumMaxElectronicSignaturePercent: value.referendumMaxElectronicSignaturePercent,
          initiativeNumberOfMembersCommittee: value.initiativeNumberOfMembersCommittee,
        };
      default:
        return {};
    }
  }

  private async saveIfEditedAndValid(): Promise<void> {
    if (this.form.dirty && this.form.valid && this.domainOfInfluence?.userPermissions?.canEdit) {
      await this.save(this.domainOfInfluence, false);
    }
  }

  private buildForm(): FormGroup<Form> {
    return this.formBuilder.group({
      addressName: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.simpleSlText],
      }),
      street: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(150)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      zipCode: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(15)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      locality: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(150)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      phone: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(254), InputValidators.phone],
      }),
      email: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(254), Validators.email],
      }),
      webpage: this.formBuilder.control('', {
        validators: [Validators.maxLength(10000)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      notificationEmails: this.formBuilder.control<string[]>([]),
    });
  }

  private buildCollectionForm(): FormGroup<CollectionForm> {
    return this.formBuilder.group({
      initiativeMinSignatureCount: this.formBuilder.control<number | undefined>(undefined, {
        validators: [Validators.required, Validators.min(0)],
      }),
      initiativeMaxElectronicSignaturePercent: this.formBuilder.control<number | undefined>(undefined, {
        validators: [Validators.required, Validators.min(0), Validators.max(100)],
      }),
      referendumMinSignatureCount: this.formBuilder.control<number | undefined>(undefined, {
        validators: [Validators.required, Validators.min(0)],
      }),
      referendumMaxElectronicSignaturePercent: this.formBuilder.control<number | undefined>(undefined, {
        validators: [Validators.required, Validators.min(0), Validators.max(100)],
      }),
      initiativeNumberOfMembersCommittee: this.formBuilder.control<number | undefined>(undefined, {
        validators: [Validators.min(0)],
      }),
    });
  }
}

export interface Form {
  addressName: FormControl<string>;
  street: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  webpage: FormControl<string>;
  notificationEmails: FormControl<string[]>;
}

export interface CollectionForm {
  initiativeMinSignatureCount: FormControl<number | undefined>;
  initiativeMaxElectronicSignaturePercent: FormControl<number | undefined>;
  referendumMinSignatureCount: FormControl<number | undefined>;
  referendumMaxElectronicSignaturePercent: FormControl<number | undefined>;
  initiativeNumberOfMembersCommittee: FormControl<number | undefined>;
}
