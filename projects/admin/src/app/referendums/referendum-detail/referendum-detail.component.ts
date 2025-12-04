/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Referendum } from '../../core/models/referendum.model';
import {
  AlertBarModule,
  ButtonModule,
  CardModule,
  DialogService,
  DividerModule,
  IconButtonModule,
  LabelModule,
  LinkModule,
  ReadonlyModule,
  StatusLabelModule,
  SubNavigationBarModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { FileChipComponent, ImageUploadComponent } from 'ecollecting-lib';
import { AsyncPipe } from '@angular/common';
import { Collection } from '../../core/models/collection.model';
import { CollectionDetailPermissionsComponent } from '../../core/components/collection-permissions/collection-permissions.component';
import { AbstractCollectionDetailBase } from '../../core/components/collection-detail-base/collection-detail-base.component';

@Component({
  selector: 'app-referendum-detail',
  templateUrl: './referendum-detail.component.html',
  styleUrls: ['./referendum-detail.component.scss'],
  imports: [
    SubNavigationBarModule,
    TranslatePipe,
    CardModule,
    TooltipModule,
    TruncateWithTooltipModule,
    IconButtonModule,
    ButtonModule,
    AlertBarModule,
    StatusLabelModule,
    FileChipComponent,
    DividerModule,
    ReadonlyModule,
    LinkModule,
    AsyncPipe,
    ImageUploadComponent,
    LabelModule,
    CollectionDetailPermissionsComponent,
  ],
  providers: [DialogService],
})
export class ReferendumDetailComponent extends AbstractCollectionDetailBase implements OnDestroy {
  protected referendum?: Referendum;

  private routeSubscription: Subscription;

  constructor() {
    super();
    this.routeSubscription = this.route.data.subscribe(async ({ referendum }) => (this.referendum = referendum));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected override get collection(): Collection | undefined {
    return this.referendum?.collection;
  }
}
