/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DividerModule, ReadonlyModule } from '@abraxas/base-components';
import { Referendum } from '../../../core/models/referendum.model';
import { Initiative } from '../../../core/models/initiative.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CollectionSignatureSheet } from '../../../core/models/collection.model';

@Component({
  selector: 'app-signature-sheet-header',
  templateUrl: './signature-sheet-header.component.html',
  imports: [TranslatePipe, DecimalPipe, DatePipe, ReadonlyModule, DividerModule],
  styleUrls: ['./signature-sheet-header.component.scss'],
})
export class SignatureSheetHeaderComponent implements OnDestroy {
  protected collection?: Referendum | Initiative;
  protected sheet?: CollectionSignatureSheet;

  private readonly routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.data.subscribe(({ collection, sheet }) => {
      this.collection = collection;
      this.sheet = sheet;
    });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
