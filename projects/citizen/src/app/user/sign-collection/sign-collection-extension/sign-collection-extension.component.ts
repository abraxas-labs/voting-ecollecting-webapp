/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, inject } from '@angular/core';
import { AlertBarModule, ButtonModule } from '@abraxas/base-components';
import { Collection } from '../../../core/models/collection.model';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { CollectionPeriodState, CollectionState, CollectionType } from '@abraxas/voting-ecollecting-proto';
import { signInitiativeUrl, signReferendumUrl } from '../../user.routes';

@Component({
  selector: 'app-sign-collection-extension',
  imports: [ButtonModule, TranslatePipe, AlertBarModule],
  templateUrl: './sign-collection-extension.component.html',
  styleUrls: ['./sign-collection-extension.component.scss'],
})
export class SignCollectionExtensionComponent {
  private readonly router = inject(Router);
  private readonly collectionService = inject(CollectionService);

  protected readonly collectionStates = CollectionState;
  protected readonly collectionPeriodStates = CollectionPeriodState;

  @Input({ required: true })
  public collection!: Collection;

  public async downloadSignatureList(collection: Collection): Promise<void> {
    if (!collection.signatureSheetTemplate) {
      return;
    }

    await this.collectionService.downloadSignatureSheetTemplate(collection.id, false);
  }

  public async signOnline(collection: Collection): Promise<void> {
    const typeSegment = collection.type === CollectionType.COLLECTION_TYPE_REFERENDUM ? signReferendumUrl : signInitiativeUrl;
    await this.router.navigate(['-', 'user', typeSegment, collection.id]);
  }
}
