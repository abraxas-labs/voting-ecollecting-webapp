/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import {
  ButtonModule,
  CardModule,
  DialogService,
  ErrorModule,
  LinkModule,
  RadioButtonModule,
  SpinnerModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfirmDialogService, FileChipComponent, FileUploadComponent, ToastService } from 'ecollecting-lib';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { CollectionService } from '../../services/collection.service';
import { Collection } from '../../models/collection.model';

@Component({
  selector: 'app-collection-detail-signature-sheet',
  imports: [
    CardModule,
    TranslatePipe,
    RadioButtonModule,
    SpinnerModule,
    FileUploadComponent,
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    ButtonModule,
    LinkModule,
    FileChipComponent,
    ErrorModule,
  ],
  templateUrl: './collection-detail-signature-sheet.component.html',
  styleUrl: './collection-detail-signature-sheet.component.scss',
})
export class CollectionDetailSignatureSheetComponent implements OnDestroy {
  private readonly dialogService = inject(DialogService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly collectionService = inject(CollectionService);
  private readonly toast = inject(ToastService);

  protected collection?: Collection;
  protected settingFile: boolean = false;
  protected isGeneratingPreview: boolean = false;
  protected maxSizeInBytes: number = 5 * 1024 * 1024; // 5 MB

  private readonly routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.parent!.data.subscribe(
      ({ initiative, referendum }) => (this.collection = initiative?.collection ?? referendum?.collection),
    );
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  public async setFile(file: File): Promise<void> {
    if (!this.collection) {
      return;
    }

    if (this.collection.signatureSheetTemplate) {
      const ok = await this.confirmDialogService.confirm({
        title: 'COLLECTION.DETAIL.SIGNATURE_SHEET.OVERWRITE_FILE_CONFIRMATION.TITLE',
        message: 'COLLECTION.DETAIL.SIGNATURE_SHEET.OVERWRITE_FILE_CONFIRMATION.MSG',
        confirmText: 'APP.YES',
        discardText: 'APP.DISCARD',
      });
      if (!ok) {
        return;
      }
    }

    try {
      this.settingFile = true;
      this.collection.signatureSheetTemplate = { id: '', name: file.name };
      await this.collectionService.setSignatureSheet(this.collection.id, file);
      this.toast.success('COLLECTION.DETAIL.SIGNATURE_SHEET.UPLOADED');
    } finally {
      this.settingFile = false;
    }
  }

  public async removeFile(): Promise<void> {
    if (!this.collection) {
      return;
    }

    if (!(await this.confirmRemoveFile())) {
      return;
    }

    delete this.collection.signatureSheetTemplate;
    await this.collectionService.deleteSignatureSheetTemplate(this.collection.id);
  }

  public async openFile(): Promise<void> {
    if (!this.collection?.signatureSheetTemplate) {
      return;
    }

    await this.collectionService.downloadSignatureSheetTemplate(this.collection.id, true);
  }

  public async setGenerated(generated: boolean): Promise<void> {
    if (!this.collection) {
      return;
    }

    if (generated && this.collection.signatureSheetTemplate && !(await this.confirmRemoveFile())) {
      this.collection.signatureSheetTemplateGenerated = false;
      return;
    }

    this.collection.signatureSheetTemplateGenerated = generated;
    delete this.collection.signatureSheetTemplate;

    if (!generated) {
      return;
    }

    // if generated=true automatically generate new preview
    this.isGeneratingPreview = true;
    try {
      await this.collectionService.setSignatureSheetFileTemplateGenerated(this.collection.id, this.collection.type);
    } finally {
      this.isGeneratingPreview = false;
    }

    this.setSignatureSheet();
  }

  public async confirmRemoveFile(): Promise<boolean> {
    return this.confirmDialogService.confirm({
      title: 'COLLECTION.DETAIL.SIGNATURE_SHEET.REMOVE_FILE_CONFIRMATION.TITLE',
      message: 'COLLECTION.DETAIL.SIGNATURE_SHEET.REMOVE_FILE_CONFIRMATION.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
  }

  public async generatePreview(): Promise<void> {
    if (!this.collection) {
      return;
    }

    try {
      this.isGeneratingPreview = true;
      delete this.collection.signatureSheetTemplate;
      await this.collectionService.generateSignatureSheetTemplatePreview(this.collection.id, this.collection.type);
      this.setSignatureSheet();
    } finally {
      this.isGeneratingPreview = false;
    }
  }

  private setSignatureSheet() {
    if (!this.collection) {
      return;
    }

    this.collection.signatureSheetTemplate = { id: '', name: 'Unterschriftenliste.pdf' };
  }
}
