/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Directive, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfirmDialogService,
  generateSecureRandomString,
  getGrpcErrorOrThrow,
  isGrpcNotFoundError,
  storage,
  storageKeyPrefix,
} from 'ecollecting-lib';
import { emailDoesNotMatchException, insufficientAcrException } from '../../exceptions';
import { AuthenticationService } from '../../services/authentication.service';

const tokenStorageKey = storageKeyPrefix + 'approval_token';
const acceptKey = storageKeyPrefix + 'accept';

@Directive()
export abstract class ApprovalPageBaseComponent<T> implements OnInit {
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthenticationService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected data?: T;
  protected notFound = false;
  protected error?: string;
  protected loading = true;
  protected rejected = false;

  protected token: string = '';

  private readonly storageKeyPrefix: string;

  protected constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject
    storageKeyName: string,
    // eslint-disable-next-line @angular-eslint/prefer-inject
    private readonly i18nGroup: string,
  ) {
    this.storageKeyPrefix = storageKeyPrefix + storageKeyName;
  }

  protected abstract get acceptAcceptedAcrs(): string[];

  public async ngOnInit(): Promise<void> {
    // use the fragment to not send the token to the server in the url,
    // only send it in the body which is less likely to get logged etc.
    this.token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token')!;
    if (!!this.token) {
      storage.setItem(this.storageKeyPrefix + tokenStorageKey, this.token);
      await this.clearRouteParams();
    } else {
      this.token = storage.getItem(this.storageKeyPrefix + tokenStorageKey)!;
    }

    if (!this.token) {
      this.token = '00000000-0000-0000-0000-000000000000';
    }

    await this.loadData(this.token);

    const acceptState = storage.getItem(acceptKey);
    if (acceptState) {
      storage.removeItem(acceptKey);
      await this.continueAccept(acceptState);
    }
  }

  protected async accept(): Promise<void> {
    if (!(await this.confirm('IAM'))) {
      return;
    }

    const state = generateSecureRandomString();
    storage.setItem(acceptKey, state);
    await this.auth.login({ forceLogin: true, state, acrValues: this.acceptAcceptedAcrs });
  }

  protected async reject(): Promise<void> {
    if (!(await this.confirm('REJECT'))) {
      return;
    }

    await this.rejectByToken(this.token);
    this.rejected = true;
  }

  protected abstract rejectByToken(token: string): Promise<void>;

  protected abstract acceptByToken(token: string): Promise<void>;

  protected abstract loadDataByToken(token: string): Promise<T>;

  private async confirm(action: 'IAM' | 'REJECT'): Promise<boolean> {
    return this.confirmDialogService.confirm({
      title: `${this.i18nGroup}.${action}.CONFIRM.TITLE`,
      message: `${this.i18nGroup}.${action}.CONFIRM.MESSAGE`,
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
  }

  private async continueAccept(state: string): Promise<void> {
    await this.auth.login({ state });

    try {
      await this.acceptByToken(this.token);
    } catch (e) {
      this.error = getGrpcErrorOrThrow(e, [insufficientAcrException, emailDoesNotMatchException]);
    }
  }

  private async clearRouteParams() {
    await this.router.navigate([], { relativeTo: this.route, fragment: undefined, queryParams: undefined, replaceUrl: true });
  }

  private async loadData(token: string): Promise<void> {
    try {
      this.token = token;
      this.data = await this.loadDataByToken(token);
    } catch (e) {
      if (isGrpcNotFoundError(e)) {
        this.notFound = true;
      } else {
        throw e;
      }
    } finally {
      this.loading = false;
    }
  }
}
