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
  ColorTokensThemes,
  CornerRadiusTokensThemes,
  NavBarModule,
  SnackbarComponent,
  SnackbarModule,
  SpinnerModule,
  StylingService,
  Tenant,
} from '@abraxas/base-components';
import { OAuthService } from 'angular-oauth2-oidc';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { SnackbarService, VotingLibModule } from '@abraxas/voting-lib';
import { filter, firstValueFrom, Subscription } from 'rxjs';
import { LocationStrategy } from '@angular/common';
import { LanguageService, RouteDataPipe } from 'ecollecting-lib';
import { Title } from '@angular/platform-browser';
import { administrationUrl, controlSignUrl, initiativeUrl, referendumUrl } from './app.routes';
import 'moment/locale/de';
import { HasAnyRoleDirective } from './core/directives/has-any-role.directive';
import { environment } from '../environments/environment';

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
  public loading = true;
  public appTitle: string = '';
  public customHeaderColor?: string;

  @ViewChild(SnackbarComponent)
  public snackbarComponent?: SnackbarComponent;

  private readonly subscriptions: Subscription[] = [];

  constructor() {
    const stylingService = inject(StylingService);

    stylingService.setTheme(ColorTokensThemes.SGSchalterELight);
    stylingService.setRadius(CornerRadiusTokensThemes.Large);

    // enable automatic silent refresh
    this.oauthService.setupAutomaticSilentRefresh({}, 'access_token');

    this.customHeaderColor = environment.customHeaderColor;

    const snackbarSubscription = this.snackbarService.message$.subscribe(m => {
      if (!this.snackbarComponent) {
        return;
      }

      this.snackbarComponent.message = m.message;
      this.snackbarComponent.variant = m.variant;
      this.snackbarComponent.open();
    });
    this.subscriptions.push(snackbarSubscription);

    const authSubscription = this.auth.authenticationChanged.pipe(filter(isAuthenticated => isAuthenticated)).subscribe(async () => {
      this.authenticated = true;

      try {
        // getActiveTenant is called to initialize the tenant cache, otherwise the authorization endpoint would be called multiple times
        await this.authorization.getActiveTenant();
        this.hasTenant = true;
      } catch {
        this.hasTenant = false;
      } finally {
        this.loading = false;
      }
    });
    this.subscriptions.push(authSubscription);
  }

  public async switchTenant(): Promise<void> {
    window.location.reload(); // reload to ensure consistent state across all components, needed due to some base-components
  }

  public async ngOnInit(): Promise<void> {
    moment.locale(this.languageService.currentLanguage);
    this.translations.setDefaultLang(this.languageService.currentLanguage);

    // Cannot use translations.instant here, as the translations may not have been loaded yet
    // It would then just display the non-translated string
    this.appTitle = await firstValueFrom(this.translations.get('APP.TITLE'));
    this.title.setTitle(this.appTitle);
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
}
