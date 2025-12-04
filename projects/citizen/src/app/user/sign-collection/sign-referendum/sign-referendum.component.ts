/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import { AlertBarModule, ButtonModule, LinkModule, SpinnerModule, SubNavigationBarModule } from '@abraxas/base-components';
import { Referendum } from '../../../core/models/referendum.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SignPageComponent } from '../sign-page/sign-page.component';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionState } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-sign-referendum',
  imports: [AlertBarModule, ButtonModule, SpinnerModule, SubNavigationBarModule, SignPageComponent, TranslatePipe, LinkModule],
  templateUrl: './sign-referendum.component.html',
  styleUrl: './sign-referendum.component.scss',
})
export class SignReferendumComponent implements OnDestroy {
  protected readonly collectionStates = CollectionState;
  protected referendum?: Referendum;

  private readonly routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.data.subscribe(({ referendum }) => (this.referendum = referendum));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
