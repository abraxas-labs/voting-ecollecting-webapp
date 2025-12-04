/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import { Initiative } from '../../../core/models/initiative.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  AlertBarModule,
  ButtonModule,
  IconButtonModule,
  LinkModule,
  SpinnerModule,
  SubNavigationBarModule,
} from '@abraxas/base-components';
import { SignPageComponent } from '../sign-page/sign-page.component';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionState } from '@abraxas/voting-ecollecting-proto';

@Component({
  selector: 'app-sign-initiative',
  imports: [
    IconButtonModule,
    SubNavigationBarModule,
    ButtonModule,
    AlertBarModule,
    SpinnerModule,
    SignPageComponent,
    LinkModule,
    TranslatePipe,
  ],
  templateUrl: './sign-initiative.component.html',
  styleUrl: './sign-initiative.component.scss',
})
export class SignInitiativeComponent implements OnDestroy {
  protected readonly collectionStates = CollectionState;
  protected initiative?: Initiative;

  private readonly routeSubscription: Subscription;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.data.subscribe(({ initiative }) => (this.initiative = initiative));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
