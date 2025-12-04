/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component } from '@angular/core';
import { VotingLibModule } from '@abraxas/voting-lib';
import { SignCollectionOverviewComponent } from '../sign-collection/sign-collection-overview/sign-collection-overview.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-ended-collections-overview-page',
  imports: [VotingLibModule, SignCollectionOverviewComponent, TranslatePipe],
  templateUrl: './ended-collections-overview-page.component.html',
})
export class EndedCollectionsOverviewPageComponent {}
