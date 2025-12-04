/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { DialogService, DividerModule, IconButtonModule, NavBarModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { endedCollectionsUrl, launchInitiativeUrl, seekReferendumUrl, signCollectionUrl } from '../user.routes';
import { UserHelpMenuDialogComponent } from '../user-help-menu-dialog/user-help-menu-dialog.component';
import { RouteDataPipe } from 'ecollecting-lib';

@Component({
  selector: 'app-user-navigation',
  templateUrl: './user-navigation.component.html',
  styleUrls: ['./user-navigation.component.scss'],
  imports: [NavBarModule, TranslatePipe, RouterOutlet, IconButtonModule, DividerModule, RouteDataPipe],
  providers: [DialogService],
})
export class UserNavigationComponent {
  protected readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);

  protected readonly launchInitiativeUrl = launchInitiativeUrl;
  protected readonly seekReferendumUrl = seekReferendumUrl;
  protected readonly signCollectionUrl = signCollectionUrl;
  protected readonly endedCollectionsUrl = endedCollectionsUrl;

  public openHelpMenu(): void {
    this.dialogService.openRight(UserHelpMenuDialogComponent, {});
  }
}
