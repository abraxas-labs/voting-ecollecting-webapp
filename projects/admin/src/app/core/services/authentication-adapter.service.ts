/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AuthenticationService } from '@abraxas/base-components';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { AuthenticationService as SharedAuthenticationService, UserProfile } from 'ecollecting-lib';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationAdapterService implements SharedAuthenticationService, OnDestroy {
  private readonly auth = inject(AuthenticationService);

  private _userProfile?: UserProfile;

  private readonly authenticationChangedSubscription: Subscription;

  constructor() {
    this.authenticationChangedSubscription = this.auth.authenticationChanged.subscribe(() => {
      delete this._userProfile;
      this.auth.getUserProfile().then(u => (this._userProfile = u.info));
    });
  }

  public get userProfile(): UserProfile {
    if (!this._userProfile) {
      throw new Error('No user profile loaded.');
    }

    return this._userProfile;
  }

  public ngOnDestroy(): void {
    this.authenticationChangedSubscription.unsubscribe();
  }
}
