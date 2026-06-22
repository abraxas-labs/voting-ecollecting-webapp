/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input, OnInit } from '@angular/core';
import {
  AlertBarModule,
  ButtonModule,
  IconButtonModule,
  SpinnerModule,
  SubNavigationBarModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { endedCollectionsUrl, signCollectionUrl } from '../../user.routes';
import { Router } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { CollectionPeriodState, CollectionState } from '@abraxas/voting-ecollecting-proto';
import { Observable } from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ConfirmDialogService, generateSecureRandomString, storage, storageKeyPrefix, ToastService } from 'ecollecting-lib';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { Collection } from '../../../core/models/collection.model';

const signKey = storageKeyPrefix + 'sign';

@Component({
  selector: 'app-sign-page',
  imports: [
    AlertBarModule,
    AsyncPipe,
    ButtonModule,
    SpinnerModule,
    SubNavigationBarModule,
    TranslatePipe,
    TruncateWithTooltipModule,
    IconButtonModule,
  ],
  templateUrl: './sign-page.component.html',
  styleUrl: './sign-page.component.scss',
})
export class SignPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthenticationService);
  private readonly collectionService = inject(CollectionService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  protected readonly periodStates = CollectionPeriodState;
  protected readonly states = CollectionState;

  protected image?: Observable<SafeResourceUrl>;
  protected logo?: Observable<SafeResourceUrl>;
  protected signing: boolean = false;

  @Input({ required: true })
  public navbarLabel!: string;

  @Input({ required: true })
  public collection!: Collection;

  @Input({ required: true })
  public periodState?: CollectionPeriodState;

  @Input({ required: true })
  public maxSignatures?: number;

  @Input({ required: true })
  public committee: string = '';

  @Input()
  public canSign: boolean = true;

  public async ngOnInit(): Promise<void> {
    if (this.collection.image) {
      this.image = this.collectionService.getImage(this.collection.id);
    }
    if (this.collection.logo) {
      this.logo = this.collectionService.getLogo(this.collection.id);
    }

    const signState = storage.getItem(signKey);
    if (signState) {
      storage.removeItem(signKey);
      await this.continueSign(signState);
    }
  }

  protected async sign(): Promise<void> {
    const ok = await this.confirmDialogService.confirm({
      title: 'SIGN_COLLECTION.CONFIRM.TITLE',
      message: `SIGN_COLLECTION.CONFIRM.MESSAGES.${this.collection.type}`,
      confirmText: 'SIGN_COLLECTION.CONFIRM.CONFIRM',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    this.signing = true;
    const state = generateSecureRandomString();
    storage.setItem(signKey, state);
    await this.auth.login({ forceLogin: true, state, acrValues: this.collection.signAcceptedAcrs });
  }

  protected async back(): Promise<void> {
    const isExpired =
      this.periodState === CollectionPeriodState.COLLECTION_PERIOD_STATE_EXPIRED ||
      this.collection.state === CollectionState.COLLECTION_STATE_ENDED_CAME_ABOUT ||
      this.collection.state === CollectionState.COLLECTION_STATE_ENDED_CAME_NOT_ABOUT;
    await this.router.navigate(['user', isExpired ? endedCollectionsUrl : signCollectionUrl]);
  }

  protected async downloadSignatureList(): Promise<void> {
    if (!this.collection?.signatureSheetTemplate) {
      return;
    }

    await this.collectionService.downloadSignatureSheetTemplate(this.collection.id, false);
  }

  private async continueSign(state: string): Promise<void> {
    if (!this.collection) {
      return;
    }

    this.signing = true;
    try {
      await this.auth.login({ state });
      await this.collectionService.sign(this.collection.id, this.collection.type);
      this.canSign = false;
      this.toastService.success('SIGN_COLLECTION.SIGNED');
    } finally {
      this.signing = false;
    }
  }
}
