/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import { ButtonModule, NavigationModule, NavLayoutModule } from '@abraxas/base-components';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { admissibilityDecisionsUrl, certificatesUrl, decreesUrl, settingsUrl } from './admin.routes';
import { filter, Subscription } from 'rxjs';
import { HasAnyRoleDirective } from '../core/directives/has-any-role.directive';

@Component({
  selector: 'app-admin',
  imports: [ButtonModule, NavLayoutModule, NavigationModule, RouterOutlet, TranslatePipe, HasAnyRoleDirective],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly certificatesUrl = certificatesUrl;
  protected readonly decreesUrl = decreesUrl;
  protected readonly admissibilityDecisionsUrl = admissibilityDecisionsUrl;
  protected readonly settingsUrl = settingsUrl;

  protected active?: string;

  private routerEventsSubscription: Subscription;

  constructor() {
    this.routerEventsSubscription = this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(() => {
      this.active = this.route.firstChild?.routeConfig?.path;
    });
    this.active = this.route.firstChild?.routeConfig?.path;
  }

  public ngOnDestroy(): void {
    this.routerEventsSubscription.unsubscribe();
  }
}
