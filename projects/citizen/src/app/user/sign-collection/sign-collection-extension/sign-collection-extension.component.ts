/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, Input, OnChanges } from '@angular/core';
import { AlertBarModule, ButtonModule, IconModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { CollectionPeriodState, CollectionState, CollectionType } from '@abraxas/voting-ecollecting-proto';
import { signCollectionUrl, signInitiativeUrl, signReferendumUrl } from '../../user.routes';
import { Initiative } from '../../../core/models/initiative.model';
import { isReferendum, Referendum } from '../../../core/models/referendum.model';

@Component({
  selector: 'app-sign-collection-extension',
  imports: [ButtonModule, TranslatePipe, AlertBarModule, IconModule],
  templateUrl: './sign-collection-extension.component.html',
  styleUrls: ['./sign-collection-extension.component.scss'],
})
export class SignCollectionExtensionComponent implements OnChanges {
  private readonly router = inject(Router);
  private readonly collectionService = inject(CollectionService);

  protected readonly collectionStates = CollectionState;
  protected readonly collectionPeriodStates = CollectionPeriodState;

  @Input({ required: true })
  public collection!: Initiative | Referendum;

  protected isOtherCollectionOfSameDecreeSigned: boolean = false;
  protected isMaxElectronicSignatureCountReached: boolean = false;

  public ngOnChanges(): void {
    if (isReferendum(this.collection)) {
      this.isOtherCollectionOfSameDecreeSigned = this.collection.isOtherReferendumOfSameDecreeSigned ?? false;
      this.isMaxElectronicSignatureCountReached = this.hasReachedMaxElectronicSignatureCount(
        this.collection.decree?.maxElectronicSignatureCount,
      );
    } else {
      this.isOtherCollectionOfSameDecreeSigned = false;
      this.isMaxElectronicSignatureCountReached = this.hasReachedMaxElectronicSignatureCount(this.collection.maxElectronicSignatureCount);
    }
  }

  public async downloadSignatureList(): Promise<void> {
    if (!this.collection.collection.signatureSheetTemplate) {
      return;
    }

    await this.collectionService.downloadSignatureSheetTemplate(this.collection.id, false);
  }

  public async signOnline(): Promise<void> {
    const typeSegment =
      this.collection.collection.type === CollectionType.COLLECTION_TYPE_REFERENDUM ? signReferendumUrl : signInitiativeUrl;
    await this.router.navigate(['user', signCollectionUrl, typeSegment, this.collection.collection.id]);
  }

  private hasReachedMaxElectronicSignatureCount(maxElectronicSignatureCount?: number): boolean {
    return (
      maxElectronicSignatureCount !== undefined &&
      this.collection.collection.state === CollectionState.COLLECTION_STATE_ENABLED_FOR_COLLECTION &&
      this.collection.collection.periodState === CollectionPeriodState.COLLECTION_PERIOD_STATE_IN_COLLECTION &&
      maxElectronicSignatureCount <= (this.collection.collection.attestedCollectionCount?.electronicCitizenCount ?? 0)
    );
  }
}
