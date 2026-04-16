/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Collection } from '../../models/collection.model';
import { QRCodeComponent } from 'angularx-qrcode';
import { TranslatePipe } from '@ngx-translate/core';
import { MarkdownPreviewComponent } from '@abraxas/voting-lib';
import { Referendum } from '../../models/referendum.model';
import { Initiative, InitiativeCommittee } from '../../models/initiative.model';
import { SafeResourceUrl } from '@angular/platform-browser';
import { CollectionService } from '../../services/collection.service';
import { AsyncPipe, DatePipe } from '@angular/common';
import { InitiativeService } from '../../services/initiative.service';
import { DividerModule, TableDataSource, TableModule, TooltipModule, TruncateWithTooltipModule } from '@abraxas/base-components';

@Component({
  selector: 'app-collection-detail-signature-sheet-preview',
  imports: [
    QRCodeComponent,
    TranslatePipe,
    MarkdownPreviewComponent,
    AsyncPipe,
    DividerModule,
    TableModule,
    TooltipModule,
    TruncateWithTooltipModule,
    DatePipe,
  ],
  templateUrl: './collection-detail-signature-sheet-preview.component.html',
  styleUrl: './collection-detail-signature-sheet-preview.component.scss',
})
export class CollectionDetailSignatureSheetPreviewComponent implements OnDestroy {
  protected readonly numberColumn = 'number';
  protected readonly nameColumn = 'name';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly residenceColumn = 'residence';
  protected readonly signatureColumn = 'signature';
  protected readonly checkColumn = 'check';

  protected readonly columns = [
    this.numberColumn,
    this.nameColumn,
    this.dateOfBirthColumn,
    this.residenceColumn,
    this.signatureColumn,
    this.checkColumn,
  ];
  protected readonly minDate;

  private readonly collectionService = inject(CollectionService);
  private readonly initiativeService = inject(InitiativeService);

  private readonly routeSubscription: Subscription;

  protected dataSource = new TableDataSource<any>();
  protected collection?: Collection;
  protected initiative?: Initiative;
  protected referendum?: Referendum;
  protected committee?: InitiativeCommittee;

  protected image?: Observable<SafeResourceUrl>;
  protected logo?: Observable<SafeResourceUrl>;

  constructor() {
    const route = inject(ActivatedRoute);

    this.minDate = new Date();
    this.minDate.setFullYear(1, 0, 1);

    this.routeSubscription = route.data.subscribe(async ({ initiative, referendum }) => {
      this.initiative = initiative;
      this.referendum = referendum;
      this.collection = initiative?.collection ?? referendum?.collection;

      if (this.initiative) {
        this.committee = await this.initiativeService.getCommittee(this.initiative.id);
      }

      if (this.collection?.image) {
        this.image = this.collectionService.getImage(this.collection.id);
      }
      if (this.collection?.logo) {
        this.logo = this.collectionService.getLogo(this.collection.id);
      }
    });

    this.dataSource.data = new Array(10).fill({});
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
