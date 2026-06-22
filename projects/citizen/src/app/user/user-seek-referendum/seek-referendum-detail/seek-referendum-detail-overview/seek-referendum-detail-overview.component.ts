/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { AlertBarModule, CardModule } from '@abraxas/base-components';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Referendum } from '../../../../core/models/referendum.model';
import { CollectionPeriodState, CollectionState } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-seek-referendum-detail-overview',
  templateUrl: './seek-referendum-detail-overview.component.html',
  styleUrl: 'seek-referendum-detail-overview.component.scss',
  imports: [TranslateDirective, CardModule, AlertBarModule, TranslatePipe],
})
export class SeekReferendumDetailOverviewComponent implements OnDestroy {
  protected collectionStates = CollectionState;
  protected collectionPeriodStates = CollectionPeriodState;
  protected referendum?: Referendum;

  private routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.parent!.data.subscribe(async ({ referendum }) => {
      this.referendum = referendum;
    });
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
