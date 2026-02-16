/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { RadioButton, RadioButtonModule, TextModule } from '@abraxas/base-components';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BaseDialogWithUnsavedChangesCheckComponent, DialogComponent } from 'ecollecting-lib';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CollectionPermissionRole, CollectionPermissionState } from '@abraxas/voting-ecollecting-proto';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CollectionPermission } from '@abraxas/voting-ecollecting-proto/citizen';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-collection-detail-permission-dialog',
  templateUrl: './collection-detail-permission-dialog.component.html',
  imports: [DialogComponent, TextModule, TranslatePipe, ReactiveFormsModule, RadioButtonModule],
})
export class CollectionDetailPermissionDialogComponent extends BaseDialogWithUnsavedChangesCheckComponent<
  CollectionDetailPermissionDialogData,
  CollectionDetailPermissionDialogResult
> {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly collectionService = inject(CollectionService);
  private readonly i18n = inject(TranslateService);

  protected form!: FormGroup<Form>;
  protected saving: boolean = false;
  protected readonly roleChoices: RadioButton[];

  private readonly collectionId: string;

  constructor() {
    super();
    const dialogData = inject<CollectionDetailPermissionDialogData>(MAT_DIALOG_DATA);

    this.collectionId = dialogData.collectionId;

    this.roleChoices = [
      {
        value: CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_DEPUTY,
        displayText: this.i18n.instant('COLLECTION_PERMISSION_ROLES.' + CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_DEPUTY),
      },
      {
        value: CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_READER,
        displayText: this.i18n.instant('COLLECTION_PERMISSION_ROLES.' + CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_READER),
      },
    ];

    this.buildForm();
  }

  public async save(): Promise<void> {
    const values = this.form.value as Required<typeof this.form.value>;
    try {
      this.saving = true;
      const id = await this.collectionService.createPermission(
        this.collectionId,
        values.lastName,
        values.firstName,
        values.email,
        values.role,
      );

      this.dialogRef.close({
        permission: new CollectionPermission({
          id,
          ...values,
          collectionId: this.collectionId,
          state: CollectionPermissionState.COLLECTION_PERMISSION_STATE_PENDING,
          userPermissions: {
            canResend: true,
          },
        }),
      });
    } finally {
      this.saving = false;
    }
  }

  protected override get hasChanges(): boolean {
    return this.form.dirty;
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
      email: this.formBuilder.control('', {
        validators: [Validators.required, Validators.email],
      }),
      role: this.formBuilder.control(CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_UNSPECIFIED, {
        validators: [Validators.required],
      }),
    });
  }
}

export interface CollectionDetailPermissionDialogData {
  collectionId: string;
}

export interface CollectionDetailPermissionDialogResult {
  permission: CollectionPermission;
}

export interface Form {
  lastName: FormControl<string>;
  firstName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<CollectionPermissionRole>;
}
