/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AlertBarModule, IconModule, LabelModule, RadioButtonModule, TextModule } from '@abraxas/base-components';
import { AsyncInputValidators } from '@abraxas/voting-lib';
import { TranslatePipe } from '@ngx-translate/core';
import { DialogComponent, FileUploadComponent, ToastService } from 'ecollecting-lib';
import { CertificateService } from '../../../core/services/certificate.service';
import { CertificateValidationSummary } from '../../../core/models/certificate.model';
import { NewCertificateValidationComponent } from './new-certificate-validation/new-certificate-validation.component';
import { CertificateInfoComponent } from '../certificate-info/certificate-info.component';

@Component({
  selector: 'app-new-certificate-dialog',
  imports: [
    DialogComponent,
    FileUploadComponent,
    TextModule,
    TranslatePipe,
    ReactiveFormsModule,
    RadioButtonModule,
    AlertBarModule,
    LabelModule,
    IconModule,
    NewCertificateValidationComponent,
    CertificateInfoComponent,
  ],
  templateUrl: './new-certificate-dialog.component.html',
  styleUrl: './new-certificate-dialog.component.scss',
})
export class NewCertificateDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject<MatDialogRef<any>>(MatDialogRef);
  private readonly certService = inject(CertificateService);
  private readonly toast = inject(ToastService);

  protected readonly maxSize = 5 * 1024 * 1024; // 5 MB
  protected form!: FormGroup<Form>;
  protected importing = false;
  protected validating = false;
  protected validation?: CertificateValidationSummary;
  protected file?: File;

  constructor() {
    this.buildForm();
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected async fileSelected(file: File): Promise<void> {
    this.validating = true;
    try {
      this.file = file;
      this.validation = await this.certService.validateBackupCertificate(file);
    } finally {
      this.validating = false;
    }
  }

  protected async import(): Promise<void> {
    if (!this.validation || this.validation.state === 'Error' || !this.file) {
      return;
    }

    try {
      this.importing = true;
      await this.certService.setBackupCertificate(this.file, this.form.value.label);
      this.dialogRef.close(true);
      this.toast.success('ADMIN.CERTS.IMPORT.IMPORTED');
    } finally {
      this.importing = false;
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group<Form>({
      label: this.formBuilder.control('', {
        validators: [Validators.maxLength(100)],
        asyncValidators: [AsyncInputValidators.complexSlText],
      }),
    });
  }
}

export interface Form {
  label: FormControl<string>;
}
