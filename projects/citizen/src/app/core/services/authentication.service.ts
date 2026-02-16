/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';
import { Router, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService as SharedAuthenticationService, storage, storageKeyPrefix } from 'ecollecting-lib';
import { AuthServiceClient } from '@abraxas/voting-ecollecting-proto/citizen';
import { Empty } from '@ngx-grpc/well-known-types';

const urlStateKey = storageKeyPrefix + 'auth_path';
const forceLoginKey = storageKeyPrefix + 'force_login';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService implements SharedAuthenticationService {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly authServiceClient = inject(AuthServiceClient);

  private authenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _userProfile?: UserProfile;
  private initialized: boolean = false;

  constructor() {
    this.oauthService.events.subscribe(e => this.handleEvent(e));
  }

  public get userProfile(): UserProfile {
    if (!this._userProfile) {
      throw new Error('not authenticated');
    }

    return this._userProfile;
  }

  public get isAuthenticated(): boolean {
    return this.authenticated$.value;
  }

  public async tryLogin(): Promise<boolean> {
    await this.init();

    if (storage.getItem(forceLoginKey) != 'true' && this.oauthService.hasValidAccessToken()) {
      try {
        await this.trackLogin();
        await this.loadUserProfile();
        this.authenticated$.next(true);
        await this.tryNavigateToStoredUrl();
        return true;
      } catch (e) {
        // the access token wasn't valid anymore when it hit the user profile endpoint
        // continue with tryLogin
      }
    }

    storage.removeItem(forceLoginKey);
    await this.oauthService.tryLogin();

    // Clear auth params
    history.pushState('', document.title, window.location.pathname);
    const validToken = this.oauthService.hasValidAccessToken();
    if (!validToken) {
      return false;
    }
    await this.trackLogin();

    await this.loadUserProfile();
    this.authenticated$.next(true);
    await this.tryNavigateToStoredUrl();
    return true;
  }

  // Unfortunately, we cannot use OAuth RAR for transactional verifications,
  // because eLogin does not support it.
  // Instead, we implement a "forced login" mechanism with the following flow:
  //
  // 1. A random state string is generated and stored by the caller.
  // 2. We call login(forceLogin=true, state=generatedState), which:
  //    - Sets the "forceLogin" flag in storage.
  //    - Initiates an OIDC flow with `prompt=login`, forcing the user to reauthenticate.
  // 3. If the user cancels the reauthentication, no new authorization code is returned, and the existing token remains in use.
  // 4. If the user completes reauthentication:
  //    - The OIDC callback resumes the flow.
  //    - The app header logs in the user and invokes tryLogin().
  //    - Because forceLogin is true, a new token is fetched even if a valid one already exists.
  //    - The state is stored in-memory to track this session.
  // 5. The original initiator of the forced login calls login(state=generatedState):
  //    - The state is validated.
  //    - If valid, the user has successfully reauthenticated.
  //    - If invalid, the reauthentication was cancelled and an error is thrown.
  public async login(options?: {
    forceLogin?: boolean;
    acrValues?: string[];
    routerState?: RouterStateSnapshot;
    state?: string;
  }): Promise<void> {
    options ??= {};

    if (!options.forceLogin && (await this.tryLogin())) {
      if (!!options?.state && options.state !== this.oauthService.state) {
        throw new Error('State mismatch');
      }

      return;
    }

    storage.removeItem(forceLoginKey);
    storage.setItem(urlStateKey, (options.routerState ?? this.router.routerState.snapshot).url);

    const opts: Record<string, any> = {};
    if (options.forceLogin) {
      opts['prompt'] = 'login';
      storage.setItem(forceLoginKey, 'true');
    }

    if (options.acrValues && options.acrValues.length > 0) {
      // e-login for now can only handle one acr.
      // send only the minimal ACR, e-login accepts lower values therefore this works fine.
      opts['acr_values'] = options.acrValues[0];
    }

    this.oauthService.initLoginFlow(options.state, opts);
  }

  public async logout(): Promise<void> {
    await this.oauthService.revokeTokenAndLogout();
    this.authenticated$.next(false);
    delete this._userProfile;
  }

  private handleEvent(e: OAuthEvent): void {
    if (e.type === 'invalid_nonce_in_state') {
      this.oauthService.initLoginFlow();
    }
  }

  private async loadUserProfile(): Promise<void> {
    if (this._userProfile) {
      return;
    }

    this._userProfile = ((await this.oauthService.loadUserProfile()) as any).info as UserProfile;
  }

  private async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.oauthService.configure({
      ...environment.authenticationConfig,
      redirectUri: document.baseURI,
    });
    await this.oauthService.loadDiscoveryDocument();
    this.oauthService.setupAutomaticSilentRefresh({}, 'access_token');
    this.initialized = true;
  }

  private async tryNavigateToStoredUrl() {
    const urlState = storage.getItem(urlStateKey);
    if (!urlState) {
      return;
    }

    await this.router.navigateByUrl(urlState);
    storage.removeItem(urlStateKey);
  }

  private async trackLogin(): Promise<void> {
    await firstValueFrom(this.authServiceClient.trackLogin(new Empty()));
  }
}
