/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import { ButtonModule, NavigationModule, NavLayoutModule } from '@abraxas/base-components';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { admissibilityDecisionsUrl, certificatesUrl, decreesUrl, settingsUrl } from './admin.routes';
import { filter, startWith, Subscription } from 'rxjs';
import { HasAnyRoleDirective } from '../core/directives/has-any-role.directive';

@Component({
  selector: 'app-admin',
  imports: [ButtonModule, NavLayoutModule, NavigationModule, RouterOutlet, TranslatePipe, HasAnyRoleDirective],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnDestroy {
  private readonly router = inject(Router);

  protected readonly certificatesUrl = certificatesUrl;
  protected readonly decreesUrl = decreesUrl;
  protected readonly admissibilityDecisionsUrl = admissibilityDecisionsUrl;
  protected readonly settingsUrl = settingsUrl;

  protected active?: string;

  private routerEventsSubscription: Subscription;

  constructor() {
    this.routerEventsSubscription = this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd),
        startWith(this.router),
      )
      .subscribe(event => {
        // get fourth url param, as the type of route is stored there
        const pathParts = (event as NavigationEnd).url.split('/');
        if (pathParts.length < 4) {
          return;
        }

        this.active = pathParts[3];
      });
  }

  public ngOnDestroy(): void {
    this.routerEventsSubscription.unsubscribe();
  }
}
