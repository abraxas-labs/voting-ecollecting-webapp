/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnInit, inject } from '@angular/core';
import { AlertBarModule, ButtonModule, SpinnerModule, SubNavigationBarModule } from '@abraxas/base-components';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { endedCollectionsUrl, signCollectionUrl } from '../../user.routes';
import { Router } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { CollectionPeriodState, CollectionState } from '@abraxas/voting-ecollecting-proto';
import { Observable } from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';
import { getGrpcErrorOrThrow, storageKeyPrefix, storage, generateSecureRandomString } from 'ecollecting-lib';
import {
  collectionAlreadySignedException,
  collectionMaxElectronicSignatureCountReachedException,
  decreeAlreadySignedException,
  decreeMaxElectronicSignatureCountReachedException,
  insufficientAcrException,
  personOrVotingRightNotFoundException,
} from '../../../core/exceptions';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { Collection } from '../../../core/models/collection.model';

const signKey = storageKeyPrefix + 'sign';

@Component({
  selector: 'app-sign-page',
  imports: [AlertBarModule, AsyncPipe, ButtonModule, SpinnerModule, SubNavigationBarModule, TranslatePipe],
  templateUrl: './sign-page.component.html',
  styleUrl: './sign-page.component.scss',
})
export class SignPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthenticationService);
  private readonly collectionService = inject(CollectionService);

  protected readonly periodStates = CollectionPeriodState;
  protected readonly states = CollectionState;

  protected image?: Observable<SafeResourceUrl>;
  protected logo?: Observable<SafeResourceUrl>;
  protected signing: boolean = false;
  protected error?: string;

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
    await this.router.navigate(['-', 'user', isExpired ? endedCollectionsUrl : signCollectionUrl]);
  }

  protected async downloadSignatureList(): Promise<void> {
    if (!this.collection?.signatureSheetTemplate) {
      return;
    }

    await this.collectionService.downloadSignatureSheetTemplate(this.collection.id, false);
  }

  private async continueSign(state: string): Promise<void> {
    delete this.error;
    if (!this.collection) {
      return;
    }

    this.signing = true;
    try {
      await this.auth.login({ state });
      await this.collectionService.sign(this.collection.id, this.collection.type);
      this.collection.isSigned = true;
      this.collection.attestedCollectionCount!.electronicCitizenCount++;
    } catch (e) {
      this.error = getGrpcErrorOrThrow(e, [
        insufficientAcrException,
        collectionAlreadySignedException,
        decreeAlreadySignedException,
        collectionMaxElectronicSignatureCountReachedException,
        decreeMaxElectronicSignatureCountReachedException,
        personOrVotingRightNotFoundException,
      ]);
    } finally {
      this.signing = false;
    }
  }
}
