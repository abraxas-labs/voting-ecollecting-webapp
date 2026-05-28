/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { SnackbarService, VotingLibModule } from '@abraxas/voting-lib';
import { LanguageService, RouteDataPipe } from 'ecollecting-lib';
import {
  AccountPanelModule,
  AppHeaderBarModule,
  ButtonModule,
  ColorTokensThemes,
  CornerRadiusTokensThemes,
  LinkModule,
  SnackbarComponent,
  SnackbarModule,
  SpinnerModule,
  StylingService,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { firstValueFrom, Subscription } from 'rxjs';
import 'moment/locale/de';
import { AuthenticationService } from './core/services/authentication.service';
import { accessibilityUrl, sitemapUrl } from './app.routes';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    AppHeaderBarModule,
    RouterOutlet,
    VotingLibModule,
    TranslateModule,
    ButtonModule,
    AccountPanelModule,
    RouteDataPipe,
    SnackbarModule,
    SpinnerModule,
    LinkModule,
    TooltipModule,
    TruncateWithTooltipModule,
    RouterLink,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  public readonly route = inject(ActivatedRoute);
  public readonly auth = inject(AuthenticationService);
  private readonly translations = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly snackbarService = inject(SnackbarService);
  protected readonly accessibilityUrl = accessibilityUrl;
  protected readonly sitemapUrl = sitemapUrl;
  protected readonly now = new Date();

  public appTitle: string = '';
  public state: 'initializing' | 'authenticating' | 'initialized' = 'initializing';

  @ViewChild(SnackbarComponent)
  public snackbarComponent?: SnackbarComponent;

  private snackbarSubscription?: Subscription;

  constructor() {
    const stylingService = inject(StylingService);

    stylingService.setTheme(ColorTokensThemes.SGSchalterELight);
    stylingService.setRadius(CornerRadiusTokensThemes.Large);
  }

  public async ngOnInit(): Promise<void> {
    moment.locale(this.languageService.currentLanguage);
    this.translations.setDefaultLang(this.languageService.currentLanguage);

    // Cannot use translations.instant here, as the translations may not have been loaded yet
    // It would then just display the non-translated string
    this.appTitle = await firstValueFrom(this.translations.get('APP.TITLE'));

    this.snackbarSubscription = this.snackbarService.message$.subscribe(m => {
      if (!this.snackbarComponent) {
        return;
      }

      this.snackbarComponent.message = m.message;
      this.snackbarComponent.variant = m.variant;
      this.snackbarComponent.open();
    });

    try {
      this.state = 'authenticating';
      await this.auth.tryLogin();
    } finally {
      this.state = 'initialized';
    }
  }

  public ngOnDestroy(): void {
    this.snackbarSubscription?.unsubscribe();
  }

  public async login(): Promise<void> {
    await this.auth.login();
  }

  public async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/'], { onSameUrlNavigation: 'reload' });
  }
}
