/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  AppHeaderBarIamModule,
  AppHeaderBarModule,
  AuthenticationService,
  AuthorizationService,
  ButtonModule,
  NavBarModule,
  SnackbarComponent,
  SnackbarModule,
  SpinnerModule,
} from '@abraxas/base-components';
import { OAuthService } from 'angular-oauth2-oidc';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { SnackbarService, ThemeService, VotingLibModule } from '@abraxas/voting-lib';
import { firstValueFrom, Subscription } from 'rxjs';
import { LocationStrategy } from '@angular/common';
import { LanguageService, RouteDataPipe } from 'ecollecting-lib';
import { Title } from '@angular/platform-browser';
import { administrationUrl, controlSignUrl, initiativeUrl, referendumUrl } from './app.routes';
import 'moment/locale/de';
import { HasAnyRoleDirective } from './core/directives/has-any-role.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    SpinnerModule,
    SnackbarModule,
    AppHeaderBarIamModule,
    AppHeaderBarModule,
    ButtonModule,
    RouterOutlet,
    VotingLibModule,
    TranslateModule,
    NavBarModule,
    RouteDataPipe,
    HasAnyRoleDirective,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  public readonly route = inject(ActivatedRoute);
  private readonly translations = inject(TranslateService);
  private readonly oauthService = inject(OAuthService);
  private readonly auth = inject(AuthenticationService);
  private readonly authorization = inject(AuthorizationService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly languageService = inject(LanguageService);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly title = inject(Title);

  protected readonly referendumUrl = referendumUrl;
  protected readonly initiativeUrl = initiativeUrl;
  protected readonly controlSignUrl = controlSignUrl;
  protected readonly administrationUrl = administrationUrl;

  public authenticated = false;
  public hasTenant = false;
  public loading = false;
  public theme?: string;
  public customLogo?: string;
  public appTitle: string = '';

  @ViewChild(SnackbarComponent)
  public snackbarComponent?: SnackbarComponent;

  private readonly subscriptions: Subscription[] = [];

  constructor() {
    const themeService = inject(ThemeService);

    // enable automatic silent refresh
    this.oauthService.setupAutomaticSilentRefresh({}, 'access_token');

    const snackbarSubscription = this.snackbarService.message$.subscribe(m => {
      if (!this.snackbarComponent) {
        return;
      }

      this.snackbarComponent.message = m.message;
      this.snackbarComponent.variant = m.variant;
      this.snackbarComponent.open();
    });
    this.subscriptions.push(snackbarSubscription);

    const themeSubscription = themeService.theme$.subscribe(theme => this.onThemeChange(theme));
    this.subscriptions.push(themeSubscription);

    const logoSubscription = themeService.logo$.subscribe(logo => (this.customLogo = logo));
    this.subscriptions.push(logoSubscription);
  }

  public async switchTenant(): Promise<void> {
    window.location.reload(); // reload to ensure consistent state across all components, needed due to some base-components
  }

  public async ngOnInit(): Promise<void> {
    moment.locale(this.languageService.currentLanguage);
    this.translations.setDefaultLang(this.languageService.currentLanguage);
    this.authenticated = false;
    this.hasTenant = false;
    this.loading = true;

    if (!(await this.auth.authenticate())) {
      this.loading = false;
      return;
    }

    this.authenticated = true;

    try {
      await this.authorization.getActiveTenant();
      this.hasTenant = true;
    } catch (e) {
      this.hasTenant = false;
    } finally {
      this.loading = false;
    }
  }

  public async reload(): Promise<void> {
    window.location.href = this.locationStrategy.getBaseHref();
  }

  public logout(): void {
    this.auth.logout();
  }

  public ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  private async onThemeChange(theme?: string): Promise<void> {
    if (!theme) {
      return;
    }

    // Cannot use translations.instant here, as the translations may not have been loaded yet
    // It would then just display the non-translated string
    this.appTitle = await firstValueFrom(this.translations.get('APP.TITLE.' + theme));
    this.title.setTitle(this.appTitle);

    this.theme = theme;
  }
}
