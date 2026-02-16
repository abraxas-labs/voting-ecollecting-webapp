/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Directive, inject, OnInit } from '@angular/core';
import { Collection } from '../../models/collection.model';
import {
  CollectionMessagesComponent,
  CollectionMessagesComponentData,
  CollectionMessagesComponentResult,
  ConfirmDialogService,
} from 'ecollecting-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@abraxas/base-components';
import { CollectionService } from '../../services/collection.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom, Observable } from 'rxjs';

@Directive()
export abstract class AbstractCollectionDetailBase implements OnInit {
  protected readonly route = inject(ActivatedRoute);
  protected readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly collectionService = inject(CollectionService);
  protected readonly confirmDialogService = inject(ConfirmDialogService);
  protected deleting = false;
  protected imageLoading = false;
  protected logoLoading = false;

  protected image?: Observable<SafeResourceUrl>;
  protected logo?: Observable<SafeResourceUrl>;

  public async ngOnInit(): Promise<void> {
    this.loadLogo();
    this.loadImage();
  }

  public async back(): Promise<void> {
    await this.router.navigate(['..'], { relativeTo: this.route });
  }

  public async openChat(): Promise<void> {
    if (!this.collection) {
      return;
    }

    const dialogRef = this.dialogService.openRight(CollectionMessagesComponent, {
      collectionId: this.collection.id,
      collectionType: this.collection.type,
      isEditable: this.collection.userPermissions?.canCreateMessages ?? false,
      isRequestInformalReviewVisible: this.collection.userPermissions?.isRequestInformalReviewVisible ?? false,
      canRequestInformalReview: false,
    } satisfies CollectionMessagesComponentData);

    const result = (await firstValueFrom(dialogRef.afterClosed())) as CollectionMessagesComponentResult;

    if (!result || !this.collection.userPermissions) {
      return;
    }

    this.collection.informalReviewRequested = result.informalReviewRequested;
  }

  public async openSignatureSheet(): Promise<void> {
    if (!this.collection?.signatureSheetTemplate) {
      return;
    }

    await this.collectionService.downloadSignatureSheet(this.collection.id);
  }

  public async deleteSignatureSheet(): Promise<void> {
    if (!this.collection?.signatureSheetTemplate) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    try {
      this.deleting = true;
      await this.collectionService.deleteSignatureSheetTemplate(this.collection.id, this.collection.type);
      this.setSignatureSheet();
    } finally {
      this.deleting = false;
    }
  }

  public async deleteImage(): Promise<void> {
    if (!this.collection) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    try {
      this.deleting = true;
      delete this.image;
      await this.collectionService.deleteImage(this.collection.id, this.collection.type);
    } finally {
      this.deleting = false;
    }
  }

  public async deleteLogo(): Promise<void> {
    if (!this.collection) {
      return;
    }

    const ok = await this.confirmDialogService.confirm({
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    try {
      this.deleting = true;
      delete this.logo;
      await this.collectionService.deleteLogo(this.collection.id, this.collection.type);
    } finally {
      this.deleting = false;
    }
  }

  protected abstract get collection(): Collection | undefined;

  private setSignatureSheet() {
    if (!this.collection) {
      return;
    }

    this.collection.signatureSheetTemplate = { id: '', name: 'Unterschriftenliste.pdf' };
    this.collection.signatureSheetTemplateGenerated = true;
  }

  private loadLogo(): void {
    if (!this.collection?.logo) {
      delete this.logo;
      return;
    }

    try {
      this.logoLoading = true;
      this.logo = this.collectionService.getLogo(this.collection.id);
    } finally {
      this.logoLoading = false;
    }
  }

  private loadImage(): void {
    if (!this.collection?.image) {
      delete this.image;
      return;
    }

    try {
      this.imageLoading = true;
      this.image = this.collectionService.getImage(this.collection.id);
    } finally {
      this.imageLoading = false;
    }
  }
}
