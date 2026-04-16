/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy, SecurityContext } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { ButtonModule, CardModule, ErrorModule, IconModule, LinkModule, RadioButtonModule, SpinnerModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfirmDialogService, FileChipComponent, FileInputComponent, ToastService } from 'ecollecting-lib';
import { FormsModule } from '@angular/forms';
import { CollectionService } from '../../services/collection.service';
import { Collection } from '../../models/collection.model';
import { QRCodeComponent } from 'angularx-qrcode';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { detailSignatureSheetPreviewUrl, signInitiativeUrl, signReferendumUrl } from '../../../user/user.routes';
import { userUrl } from '../../../app.routes';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-collection-detail-signature-sheet',
  imports: [
    CardModule,
    TranslatePipe,
    RadioButtonModule,
    SpinnerModule,
    FormsModule,
    ButtonModule,
    LinkModule,
    FileChipComponent,
    ErrorModule,
    IconModule,
    QRCodeComponent,
    FileInputComponent,
    RouterLink,
  ],
  templateUrl: './collection-detail-signature-sheet.component.html',
  styleUrl: './collection-detail-signature-sheet.component.scss',
})
export class CollectionDetailSignatureSheetComponent implements OnDestroy {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly collectionService = inject(CollectionService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformLocation = inject(PlatformLocation);
  private readonly router = inject(Router);

  protected readonly detailSignatureSheetPreviewUrl = detailSignatureSheetPreviewUrl;

  protected collection?: Collection;
  protected settingFile: boolean = false;
  protected isGeneratingPreview: boolean = false;
  protected maxSizeInBytes: number = 5 * 1024 * 1024; // 5 MB
  protected qrCodeData?: string;
  protected signatureSheetTemplateFile?: File;
  protected signatureSheetTemplateFileError = false;

  // download url to download the qr code svg
  protected qrCodeDownloadUrl?: SafeUrl;

  private readonly routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.parent!.data.subscribe(({ initiative, referendum }) => {
      this.collection = initiative?.collection ?? referendum?.collection;
      if (this.collection?.signatureSheetTemplate) {
        this.signatureSheetTemplateFile = new File([], this.collection.signatureSheetTemplate.name);
      }
      this.buildQrCodeData();
    });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected async updateFiles(files?: File[]): Promise<void> {
    if (!this.collection || !files || files.length !== 1) {
      return;
    }

    const file = files[0];
    try {
      this.signatureSheetTemplateFileError = false;
      this.settingFile = true;
      this.collection.signatureSheetTemplate = { id: '', name: file.name };
      await this.collectionService.setSignatureSheet(this.collection.id, file);
      this.toast.success('COLLECTION.DETAIL.SIGNATURE_SHEET.UPLOADED');
    } catch (e) {
      this.signatureSheetTemplateFileError = true;
      throw e;
    } finally {
      this.settingFile = false;
    }
  }

  protected async deleteFile(): Promise<void> {
    if (!this.collection || !this.collection.userPermissions?.canDeleteSignatureSheetTemplate || !this.collection.signatureSheetTemplate) {
      return;
    }

    if (!(await this.confirmRemoveFile())) {
      this.signatureSheetTemplateFile = new File([], this.collection.signatureSheetTemplate.name);
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
    delete this.signatureSheetTemplateFile;

    if (!generated) {
      return;
    }

    // if generated=true automatically generate new preview
    this.isGeneratingPreview = true;
    try {
      this.toast.info('COLLECTION.DETAIL.SIGNATURE_SHEET.GENERATING');
      this.collection.signatureSheetTemplate = await this.collectionService.setSignatureSheetFileTemplateGenerated(
        this.collection.id,
        this.collection.type,
      );
      this.toast.success('COLLECTION.DETAIL.SIGNATURE_SHEET.GENERATED');
    } finally {
      this.isGeneratingPreview = false;
    }
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
      this.toast.info('COLLECTION.DETAIL.SIGNATURE_SHEET.GENERATING');
      this.collection.signatureSheetTemplate = await this.collectionService.generateSignatureSheetTemplatePreview(
        this.collection.id,
        this.collection.type,
      );
      this.toast.success('COLLECTION.DETAIL.SIGNATURE_SHEET.GENERATED');
    } finally {
      this.isGeneratingPreview = false;
    }
  }

  protected qrCodeDownloadUrlChanged(downloadUrl: SafeUrl): void {
    this.qrCodeDownloadUrl = downloadUrl;
  }

  protected downloadQrCode(): void {
    if (!this.qrCodeDownloadUrl || !this.collection) {
      return;
    }

    const url = this.sanitizer.sanitize(SecurityContext.URL, this.qrCodeDownloadUrl);
    if (!url) {
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = this.collection.description + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private buildQrCodeData(): void {
    if (!this.collection) {
      return;
    }

    const signUrl = this.collection.type === CollectionType.COLLECTION_TYPE_INITIATIVE ? signInitiativeUrl : signReferendumUrl;

    // the base href (e.g., /ecollecting/citizen/)
    const baseHref = this.platformLocation.getBaseHrefFromDOM();
    const tree = this.router.createUrlTree([baseHref, userUrl, signUrl, this.collection.id]);
    const path = this.router.serializeUrl(tree);

    // combine with Origin for a full absolute URL
    this.qrCodeData = window.location.origin + path;
  }
}
