/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import {
  CardModule,
  DropdownModule,
  FileInputModule,
  ReadonlyModule,
  SpinnerModule,
  TextareaModule,
  TextModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CollectionAddress,
  DomainOfInfluence,
  ImageUploadComponent,
  InitiativeSubType,
  newObjectUrlObservableForBlob,
} from 'ecollecting-lib';
import { Initiative } from '../../../../core/models/initiative.model';
import { InitiativeService } from '../../../../core/services/initiative.service';
import { DomainOfInfluenceService } from '../../../../core/services/domain-of-influence.service';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { CollectionService } from '../../../../core/services/collection.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { HasUnsavedChanges } from '../../../../core/guards/has-unsaved-changes.guard';

@Component({
  selector: 'app-launch-initiative-detail-general-information',
  templateUrl: './launch-initiative-detail-general-information.component.html',
  styleUrls: ['./launch-initiative-detail-general-information.component.scss'],
  imports: [
    CardModule,
    TranslatePipe,
    DropdownModule,
    ReadonlyModule,
    TextModule,
    ReactiveFormsModule,
    TextareaModule,
    DecimalPipe,
    SpinnerModule,
    FileInputModule,
    ImageUploadComponent,
    AsyncPipe,
  ],
})
export class LaunchInitiativeDetailGeneralInformationComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly initiativeService = inject(InitiativeService);
  private readonly domainOfInfluenceService = inject(DomainOfInfluenceService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly collectionService = inject(CollectionService);

  public readonly domainOfInfluenceTypes: typeof DomainOfInfluenceType = DomainOfInfluenceType;

  public initiative?: Initiative;
  public form!: FormGroup<Form>;
  public subTypes: InitiativeSubType[] = [];
  public domainOfInfluences: DomainOfInfluence[] = [];
  public selectedDomainOfInfluence?: DomainOfInfluence;

  public loading = true;

  public updateImageError = false;
  public imageLoading = false;
  public updateLogoError = false;
  public logoLoading = false;

  public image?: Observable<SafeResourceUrl>;
  public logo?: Observable<SafeResourceUrl>;
  public showValidationErrors = false;

  private routeSubscription?: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.buildForm();
    this.routeSubscription = route.parent!.data.subscribe(({ initiative }) => this.loadData(initiative));
    this.form.statusChanges.subscribe(async status => {
      if (status !== 'VALID') {
        return;
      }

      const values = this.form.value as Required<typeof this.form.value>;
      await this.save(
        values.description,
        values.wording,
        values.reason,
        values.address as Required<typeof values.address>,
        values.link,
        values.subType?.id,
      );

      if (!this.initiative) {
        return;
      }

      // update initiative after save, since it is not reloaded after a sub navigation from the resolver
      this.initiative.collection.description = values.description;
      this.initiative.wording = values.wording;
      this.initiative.collection.reason = values.reason;
      this.initiative.collection.address = values.address as Required<typeof values.address>;
      this.initiative.collection.link = values.link;
      this.initiative.subType = values.subType;

      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  @HostListener('window:beforeunload')
  public beforeUnload(): boolean {
    this.showValidationErrors = true;
    return !this.hasUnsavedChanges;
  }

  public async ngOnInit(): Promise<void> {
    this.loadLogo();
    this.loadImage();
  }

  public ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  public get hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  public async save(
    description: string,
    wording: string,
    reason: string,
    address: CollectionAddress,
    link: string,
    subTypeId?: string,
  ): Promise<void> {
    if (!this.form.valid || !this.initiative) {
      return;
    }

    await this.initiativeService.update(this.initiative.id, description, wording, reason, address, link, subTypeId);
    if (!this.initiative.collection.userPermissions) {
      return;
    }

    this.initiative.collection.userPermissions.canGenerateSignatureSheetTemplatePreview = true;
  }

  public async updateImage(file: File): Promise<void> {
    if (!this.initiative) {
      return;
    }

    try {
      this.updateImageError = false;
      this.imageLoading = true;
      delete this.image;
      this.initiative.collection.image = { id: '', name: file.name };
      await this.collectionService.updateImage(this.initiative.id, file);
      this.image = newObjectUrlObservableForBlob(file);
    } catch (e) {
      this.updateImageError = true;
      throw e;
    } finally {
      this.imageLoading = false;
    }
  }

  public async deleteImage(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    this.updateImageError = false;
    delete this.image;
    await this.collectionService.deleteImage(this.initiative.id);
  }

  public async updateLogo(file: File): Promise<void> {
    if (!this.initiative) {
      return;
    }

    try {
      this.updateLogoError = false;
      this.logoLoading = true;
      delete this.logo;
      this.initiative.collection.logo = { id: '', name: file.name };
      await this.collectionService.updateLogo(this.initiative.id, file);
      this.logo = newObjectUrlObservableForBlob(file);
    } catch (e) {
      this.updateLogoError = true;
      throw e;
    } finally {
      this.logoLoading = false;
    }
  }

  public async deleteLogo(): Promise<void> {
    if (!this.initiative) {
      return;
    }

    this.updateLogoError = false;
    delete this.logo;
    await this.collectionService.deleteLogo(this.initiative.id);
  }

  private loadLogo(): void {
    if (!this.initiative?.collection.logo) {
      delete this.logo;
      return;
    }

    try {
      this.logoLoading = true;
      this.logo = this.collectionService.getLogo(this.initiative.id);
    } finally {
      this.logoLoading = false;
    }
  }

  private loadImage(): void {
    if (!this.initiative?.collection.image) {
      delete this.image;
      return;
    }

    try {
      this.imageLoading = true;
      this.image = this.collectionService.getImage(this.initiative.id);
    } finally {
      this.imageLoading = false;
    }
  }

  private async loadData(initiative: Initiative): Promise<void> {
    try {
      this.loading = true;
      this.initiative = initiative;
      const subTypes = await this.initiativeService.listSubTypes();
      this.subTypes = subTypes.filter(x => x.domainOfInfluenceType === this.initiative?.domainOfInfluenceType);
      this.domainOfInfluences = await this.domainOfInfluenceService.list(undefined, [DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_MU]);
      this.selectedDomainOfInfluence = this.domainOfInfluences.find(x => x.bfs === this.initiative?.bfs);

      this.form.patchValue({
        ...this.initiative,
        subType: this.subTypes.find(x => x.id === this.initiative?.subType?.id),
        description: this.initiative.collection.description,
        link: this.initiative.collection.link,
        reason: this.initiative.collection.reason,
        address: this.initiative.collection.address,
      });
      this.updateValidators();
    } finally {
      this.loading = false;
    }
  }

  private updateValidators(): void {
    if (
      this.initiative?.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CH ||
      this.initiative?.domainOfInfluenceType === DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_CT
    ) {
      this.form.controls.subType.setValidators([Validators.required]);
    } else {
      this.form.controls.subType.clearValidators();
    }

    this.form.controls.subType.updateValueAndValidity();
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      subType: this.formBuilder.control(undefined),
      description: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
      wording: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(10_000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
      reason: this.formBuilder.control('', {
        validators: [Validators.maxLength(10_000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
      address: this.formBuilder.group({
        committeeOrPerson: this.formBuilder.control('', {
          validators: [Validators.required, Validators.maxLength(100)],
          asyncValidators: [AsyncInputValidators.complexSlText],
        }),
        streetOrPostOfficeBox: this.formBuilder.control('', {
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
      }),
      link: this.formBuilder.control('', {
        validators: [Validators.maxLength(2_000), InputValidators.httpsUrl],
      }),
    });
  }
}

export interface Form {
  subType: FormControl<InitiativeSubType | undefined>;
  description: FormControl<string>;
  wording: FormControl<string>;
  reason: FormControl<string>;
  address: FormGroup<FormAddress>;
  link: FormControl<string>;
}

export interface FormAddress {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}
