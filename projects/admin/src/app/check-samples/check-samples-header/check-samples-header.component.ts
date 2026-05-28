/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, inject } from '@angular/core';
import { Initiative } from '../../core/models/initiative.model';
import { Referendum } from '../../core/models/referendum.model';
import { CardModule, DividerModule, ReadonlyModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { IsReferendumPipe } from '../../core/pipes/is-referendum.pipe';
import { IsInitiativePipe } from '../../core/pipes/is-initiative.pipe';
import { isInitiative, isReferendum } from '../../core/models/collections-group.model';

@Component({
  selector: 'app-check-samples-header',
  templateUrl: './check-samples-header.component.html',
  styleUrls: ['./check-samples-header.component.scss'],
  imports: [CardModule, ReadonlyModule, TranslatePipe, DatePipe, IsReferendumPipe, IsInitiativePipe, DecimalPipe, DividerModule],
})
export class CheckSamplesHeaderComponent implements OnDestroy {
  protected readonly route = inject(ActivatedRoute);

  protected collection?: Initiative | Referendum;

  protected get electronicCollectionEnabled(): boolean {
    if (!this.collection) {
      return false;
    }

    if (isReferendum(this.collection)) {
      return this.collection.decree?.electronicCollectionEnabled === true;
    }

    if (isInitiative(this.collection)) {
      return this.collection.electronicCollectionEnabled;
    }

    return false;
  }

  private routeSubscription: Subscription;

  constructor() {
    this.routeSubscription = this.route.data.subscribe(({ collection }) => (this.collection = collection));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
