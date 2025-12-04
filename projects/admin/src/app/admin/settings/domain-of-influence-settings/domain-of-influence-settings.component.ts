/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { DomainOfInfluence } from '../../../core/models/domain-of-influence.model';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomainOfInfluenceService, UpdateDomainOfInfluenceRequest } from '../../../core/services/domain-of-influence.service';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import { ExpansionPanelModule, IconModule, SpinnerModule, TextModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, filter, merge, Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ImageUploadComponent, newObjectUrlObservableForBlob, ToastService } from 'ecollecting-lib';
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
  ],
  templateUrl: './domain-of-influence-settings.component.html',
  styleUrl: './domain-of-influence-settings.component.scss',
})
export class DomainOfInfluenceSettingsComponent implements OnInit, OnDestroy {
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);

  @Input({ required: true })
  public domainOfInfluence!: DomainOfInfluence;

  protected form!: FormGroup<Form>;
  protected logo?: Observable<SafeResourceUrl>;
  protected logoLoading: boolean = false;
  protected updateLogoError: boolean = false;

  protected message?: 'saving' | 'saved';

  private formSubscription?: Subscription;

  constructor() {
    this.form = this.buildForm();
  }

  public ngOnInit(): void {
    this.form.patchValue({
      ...this.domainOfInfluence,
      ...this.domainOfInfluence.address,
    });
    this.loadLogo();
    this.formSubscription = merge(
      this.form.valueChanges.pipe(
        tap(() => delete this.message),
        filter(() => this.form.valid),
      ),
      this.form.statusChanges.pipe(
        distinctUntilChanged(),
        filter(x => x === 'VALID'),
      ),
    )
      .pipe(debounceTime(200))
      .subscribe(() => this.save());
  }

  public ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  protected async save(): Promise<void> {
    try {
      this.message = 'saving';
      const value = {
        ...this.form.value,
        bfs: this.domainOfInfluence.bfs,
      } as UpdateDomainOfInfluenceRequest;
      await this.domainOfInfluenceService.update(value);
      Object.assign(this.domainOfInfluence, value);

      this.domainOfInfluence.address ??= value;
      Object.assign(this.domainOfInfluence.address, value);

      // another save operation may already be running
      if (this.message === 'saving') {
        this.message = 'saved';
      }
    } catch (e) {
      // another save operation may already be running
      if (this.message === 'saving') {
        delete this.message;
      }

      throw e;
    }
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

  private buildForm(): FormGroup<Form> {
    return this.formBuilder.group({
      name: this.formBuilder.control('', {
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
  name: FormControl<string>;
  street: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  webpage: FormControl<string>;
}
