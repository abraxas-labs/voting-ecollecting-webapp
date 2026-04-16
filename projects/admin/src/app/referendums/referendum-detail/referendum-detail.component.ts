/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
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
  SpinnerModule,
  StatusLabelModule,
  SubNavigationBarModule,
  TextModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { collectionStateColorMap, FileChipComponent, ImagePreviewComponent, ToastService } from 'ecollecting-lib';
import { Collection } from '../../core/models/collection.model';
import { CollectionDetailPermissionsComponent } from '../../core/components/collection-permissions/collection-permissions.component';
import { AbstractCollectionDetailBase } from '../../core/components/collection-detail-base/collection-detail-base.component';
import { CollectionState } from '@abraxas/voting-ecollecting-proto';
import { ReferendumDetailInfoComponent } from './referendum-detail-info/referendum-detail-info.component';
import { ReferendumDetailEditComponent } from './referendum-detail-edit/referendum-detail-edit.component';
import { ReferendumService } from '../../core/services/referendum.service';
import { AsyncPipe } from '@angular/common';

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
    SpinnerModule,
    LabelModule,
    CollectionDetailPermissionsComponent,
    TextModule,
    ReferendumDetailInfoComponent,
    ReferendumDetailEditComponent,
    ImagePreviewComponent,
    AsyncPipe,
  ],
  providers: [DialogService],
})
export class ReferendumDetailComponent extends AbstractCollectionDetailBase implements OnDestroy {
  protected readonly collectionStates = CollectionState;
  protected readonly collectionStateColorMap = collectionStateColorMap;
  protected referendum?: Referendum;
  @ViewChild(ReferendumDetailEditComponent)
  private editComponent?: ReferendumDetailEditComponent;

  private readonly referendumService = inject(ReferendumService);
  private readonly toast = inject(ToastService);
  private routeSubscription: Subscription;

  constructor() {
    super();
    this.routeSubscription = this.route.data.subscribe(async ({ referendum }) => (this.referendum = referendum));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  protected override async saveEdits(): Promise<void> {
    if (!this.referendum || !this.editComponent) {
      return;
    }

    const values = this.editComponent.getFormValues();
    if (!values) {
      return;
    }

    await this.referendumService.update(
      this.referendum.id,
      values.description,
      values.reason,
      values.address,
      values.membersCommittee,
      values.link,
    );

    this.referendum.collection.description = values.description;
    this.referendum.collection.reason = values.reason;
    this.referendum.collection.address = values.address;
    this.referendum.membersCommittee = values.membersCommittee;
    this.referendum.collection.link = values.link;
    this.toast.saved();
  }

  protected override get collection(): Collection | undefined {
    return this.referendum?.collection;
  }
}
