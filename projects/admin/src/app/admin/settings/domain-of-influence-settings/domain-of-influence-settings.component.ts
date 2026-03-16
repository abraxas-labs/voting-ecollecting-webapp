/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { DomainOfInfluence } from '../../../core/models/domain-of-influence.model';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomainOfInfluenceService, UpdateDomainOfInfluenceRequest } from '../../../core/services/domain-of-influence.service';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import {
  ButtonModule,
  ExpansionPanelModule,
  IconButtonModule,
  IconModule,
  NumberModule,
  SpinnerModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, filter, merge, Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FileChipComponent, ImageUploadComponent, newObjectUrlObservableForBlob, ToastService } from 'ecollecting-lib';
import { AsyncPipe } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';

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
    AsyncPipe,
    NumberModule,
    ButtonModule,
    FileChipComponent,
    IconButtonModule,
  ],
  templateUrl: './domain-of-influence-settings.component.html',
  styleUrl: './domain-of-influence-settings.component.scss',
})
export class DomainOfInfluenceSettingsComponent implements OnChanges, OnDestroy {
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);

  @Input({ required: true })
  public domainOfInfluence!: DomainOfInfluence;

  @Output()
  public statusMessageChange: EventEmitter<'saving' | 'saved' | undefined> = new EventEmitter<'saving' | 'saved' | undefined>();

  protected readonly form: FormGroup<Form> = this.buildForm();
  protected logo?: Observable<SafeResourceUrl>;
  protected logoLoading: boolean = false;
  protected updateLogoError: boolean = false;
  protected isSwitchingDoi: boolean = false;
  protected readonly emailToAddControl = new FormControl<string>('', {
    validators: [Validators.email],
    nonNullable: true,
  });

  protected readonly DomainOfInfluenceType = DomainOfInfluenceType;

  private formSubscription?: Subscription;

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
      this.loadLogo();

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
  public beforeUnload(): void {
    void this.saveIfEditedAndValid();
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
        settings: formValue,
        bfs: domainOfInfluence.bfs,
      } satisfies UpdateDomainOfInfluenceRequest;
      await this.domainOfInfluenceService.update(value);
      Object.assign(domainOfInfluence, value);

      domainOfInfluence.address ??= { name: value.addressName, ...value };
      Object.assign(domainOfInfluence.address, value);
      domainOfInfluence.address.name = value.addressName;

      domainOfInfluence.settings ??= {} as any;
      Object.assign(domainOfInfluence.settings, value);
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

  protected async updateLogo(file: File): Promise<void> {
    try {
      this.updateLogoError = false;
      this.logoLoading = true;
      delete this.logo;
      this.domainOfInfluence.logo = { id: '', name: file.name };
      await this.domainOfInfluenceService.updateLogo(this.domainOfInfluence.bfs, file);
      this.logo = newObjectUrlObservableForBlob(file);
      this.toast.success('ADMIN.DOMAIN_OF_INFLUENCE_SETTINGS.LOGO.SAVED');
    } catch (e) {
      this.updateLogoError = true;
      throw e;
    } finally {
      this.logoLoading = false;
    }
  }

  protected async deleteLogo(): Promise<void> {
    this.updateLogoError = false;
    delete this.logo;
    await this.domainOfInfluenceService.deleteLogo(this.domainOfInfluence.bfs);
    this.toast.success('ADMIN.DOMAIN_OF_INFLUENCE_SETTINGS.LOGO.REMOVED');
  }

  private updateValidators(): void {
    const controls = this.form.controls;

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
        validators: [Validators.maxLength(254), InputValidators.phone],
      }),
      email: this.formBuilder.control('', {
        validators: [Validators.maxLength(254), Validators.email],
      }),
      webpage: this.formBuilder.control('', {
        validators: [Validators.maxLength(10000)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      initiativeNumberOfMembersCommittee: this.formBuilder.control<number | undefined>(undefined, {
        validators: [Validators.min(0)],
      }),
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
      notificationEmails: this.formBuilder.control<string[]>([]),
    });
  }

  private loadLogo(): void {
    if (!this.domainOfInfluence?.logo) {
      delete this.logo;
      return;
    }

    try {
      this.logoLoading = true;
      this.logo = this.domainOfInfluenceService.getLogo(this.domainOfInfluence.bfs);
    } finally {
      this.logoLoading = false;
    }
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
  initiativeNumberOfMembersCommittee: FormControl<number | undefined>;
  initiativeMinSignatureCount: FormControl<number | undefined>;
  initiativeMaxElectronicSignaturePercent: FormControl<number | undefined>;
  referendumMinSignatureCount: FormControl<number | undefined>;
  referendumMaxElectronicSignaturePercent: FormControl<number | undefined>;
  notificationEmails: FormControl<string[]>;
}
