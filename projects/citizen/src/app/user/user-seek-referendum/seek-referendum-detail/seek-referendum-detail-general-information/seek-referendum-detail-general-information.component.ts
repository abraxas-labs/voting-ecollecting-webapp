/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, OnInit, inject, HostListener } from '@angular/core';
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
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageUploadComponent, newObjectUrlObservableForBlob, CollectionAddress } from 'ecollecting-lib';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { CollectionService } from '../../../../core/services/collection.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ReferendumService } from '../../../../core/services/referendum.service';
import { Referendum } from '../../../../core/models/referendum.model';
import { HasUnsavedChanges } from '../../../../core/guards/has-unsaved-changes.guard';

@Component({
  selector: 'app-seek-referendum-detail-general-information',
  templateUrl: './seek-referendum-detail-general-information.component.html',
  styleUrls: ['./seek-referendum-detail-general-information.component.scss'],
  imports: [
    CardModule,
    TranslatePipe,
    DropdownModule,
    ReadonlyModule,
    TextModule,
    ReactiveFormsModule,
    TextareaModule,
    SpinnerModule,
    FileInputModule,
    ImageUploadComponent,
    AsyncPipe,
  ],
})
export class SeekReferendumDetailGeneralInformationComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly referendumService = inject(ReferendumService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly collectionService = inject(CollectionService);

  public referendum?: Referendum;
  public form!: FormGroup<Form>;

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
    this.routeSubscription = route.parent!.data.subscribe(({ referendum }) => this.loadData(referendum));
    this.form.statusChanges.subscribe(async status => {
      if (status !== 'VALID') {
        return;
      }

      const values = this.form.value as Required<typeof this.form.value>;
      await this.save(
        values.description,
        values.reason,
        values.address as Required<typeof values.address>,
        values.membersCommittee,
        values.link,
      );

      if (!this.referendum) {
        return;
      }

      // update referendum after save, since it is not reloaded after a sub navigation from the resolver
      this.referendum.collection.description = values.description;
      this.referendum.collection.reason = values.reason;
      this.referendum.collection.address = values.address as Required<typeof values.address>;
      this.referendum.membersCommittee = values.membersCommittee;
      this.referendum.collection.link = values.link;

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
    reason: string,
    address: CollectionAddress,
    membersCommittee: string,
    link: string,
  ): Promise<void> {
    if (!this.form.valid || !this.referendum) {
      return;
    }

    await this.referendumService.update(this.referendum.id, description, reason, address, membersCommittee, link);
    if (!this.referendum.collection.userPermissions) {
      return;
    }

    this.referendum.collection.userPermissions.canGenerateSignatureSheetTemplatePreview = true;
  }

  public async updateImage(file: File): Promise<void> {
    if (!this.referendum) {
      return;
    }

    try {
      this.updateImageError = false;
      this.imageLoading = true;
      delete this.image;
      this.referendum.collection.image = { id: '', name: file.name };
      await this.collectionService.updateImage(this.referendum.id, file);
      this.image = newObjectUrlObservableForBlob(file);
    } catch (e) {
      this.updateImageError = true;
      throw e;
    } finally {
      this.imageLoading = false;
    }
  }

  public async deleteImage(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    this.updateImageError = false;
    delete this.image;
    await this.collectionService.deleteImage(this.referendum.id);
  }

  public async updateLogo(file: File): Promise<void> {
    if (!this.referendum) {
      return;
    }

    try {
      this.updateLogoError = false;
      this.logoLoading = true;
      delete this.logo;
      this.referendum.collection.logo = { id: '', name: file.name };
      await this.collectionService.updateLogo(this.referendum.id, file);
      this.logo = newObjectUrlObservableForBlob(file);
    } catch (e) {
      this.updateLogoError = true;
      throw e;
    } finally {
      this.logoLoading = false;
    }
  }

  public async deleteLogo(): Promise<void> {
    if (!this.referendum) {
      return;
    }

    this.updateLogoError = false;
    delete this.logo;
    await this.collectionService.deleteLogo(this.referendum.id);
  }

  private loadLogo(): void {
    if (!this.referendum?.collection.logo) {
      delete this.logo;
      return;
    }

    try {
      this.logoLoading = true;
      this.logo = this.collectionService.getLogo(this.referendum.id);
    } finally {
      this.logoLoading = false;
    }
  }

  private loadImage(): void {
    if (!this.referendum?.collection.image) {
      delete this.image;
      return;
    }

    try {
      this.imageLoading = true;
      this.image = this.collectionService.getImage(this.referendum.id);
    } finally {
      this.imageLoading = false;
    }
  }

  private async loadData(referendum: Referendum): Promise<void> {
    try {
      this.loading = true;
      this.referendum = referendum;

      this.form.patchValue({
        ...this.referendum,
        description: this.referendum.collection.description,
        link: this.referendum.collection.link,
        reason: this.referendum.collection.reason,
        address: this.referendum.collection.address,
      });
    } finally {
      this.loading = false;
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      description: this.formBuilder.control('', {
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [AsyncInputValidators.complexSlText],
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
      membersCommittee: this.formBuilder.control('', {
        validators: [Validators.maxLength(2_000)],
        asyncValidators: [AsyncInputValidators.complexMlText],
      }),
      link: this.formBuilder.control('', {
        validators: [Validators.maxLength(2_000), InputValidators.httpsUrl],
      }),
    });
  }
}

export interface Form {
  description: FormControl<string>;
  reason: FormControl<string>;
  address: FormGroup<FormAddress>;
  membersCommittee: FormControl<string>;
  link: FormControl<string>;
}

export interface FormAddress {
  committeeOrPerson: FormControl<string>;
  streetOrPostOfficeBox: FormControl<string>;
  zipCode: FormControl<string>;
  locality: FormControl<string>;
}
