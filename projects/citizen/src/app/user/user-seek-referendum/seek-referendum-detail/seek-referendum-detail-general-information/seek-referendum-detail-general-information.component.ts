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
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CollectionAddress, HasUnsavedChanges, ImageUploadComponent } from 'ecollecting-lib';
import { AsyncInputValidators, InputValidators } from '@abraxas/voting-lib';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CollectionService } from '../../../../core/services/collection.service';
import { ReferendumService } from '../../../../core/services/referendum.service';
import { Referendum } from '../../../../core/models/referendum.model';
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
  ],
})
export class SeekReferendumDetailGeneralInformationComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly referendumService = inject(ReferendumService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly collectionService = inject(CollectionService);

  public referendum?: Referendum;
  public form!: FormGroup<Form>;

  public loading = true;

  public image?: File;
  public logo?: File;
  public showValidationErrors = false;

  protected imageLoading: boolean = false;
  protected logoLoading: boolean = false;
  protected imageError: boolean = false;
  protected logoError: boolean = false;

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
    await this.loadLogo();
    await this.loadImage();
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

  public async updateImage(file?: File): Promise<void> {
    if (!this.referendum || !file) {
      return;
    }

    try {
      this.imageError = false;
      this.imageLoading = true;
      this.referendum.collection.image = { id: '', name: file.name };
      await this.collectionService.updateImage(this.referendum.id, file);
      this.image = file;
    } catch (e) {
      this.imageError = true;
      throw e;
    } finally {
      this.imageLoading = false;
    }
  }

  public async deleteImage(): Promise<void> {
    if (!this.referendum || !this.image) {
      return;
    }

    delete this.image;
    await this.collectionService.deleteImage(this.referendum.id);
  }

  public async updateLogo(file?: File): Promise<void> {
    if (!this.referendum || !file) {
      return;
    }

    try {
      this.logoError = false;
      this.logoLoading = true;
      this.referendum.collection.logo = { id: '', name: file.name };
      await this.collectionService.updateLogo(this.referendum.id, file);
      this.logo = file;
    } catch (e) {
      this.logoError = true;
      throw e;
    } finally {
      this.logoLoading = false;
    }
  }

  public async deleteLogo(): Promise<void> {
    if (!this.referendum || !this.logo) {
      return;
    }

    delete this.logo;
    await this.collectionService.deleteLogo(this.referendum.id);
  }

  private async loadLogo(): Promise<void> {
    if (!this.referendum?.collection.logo) {
      delete this.logo;
      return;
    }

    const blob = await this.collectionService.getLogoFile(this.referendum.id);
    this.logo = new File([blob], this.referendum.collection.logo.name, { type: blob.type });
  }

  private async loadImage(): Promise<void> {
    if (!this.referendum?.collection.image) {
      delete this.image;
      return;
    }

    const blob = await this.collectionService.getImageFile(this.referendum.id);
    this.image = new File([blob], this.referendum.collection.image.name, { type: blob.type });
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
