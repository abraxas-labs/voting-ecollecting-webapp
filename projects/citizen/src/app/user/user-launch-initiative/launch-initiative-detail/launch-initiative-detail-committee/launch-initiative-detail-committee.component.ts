/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, OnDestroy, inject } from '@angular/core';
import {
  ButtonModule,
  CardModule,
  IconButtonModule,
  IconModule,
  SpinnerModule,
  TableModule,
  TooltipModule,
} from '@abraxas/base-components';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Initiative, InitiativeCommittee } from '../../../../core/models/initiative.model';
import { InitiativeService } from '../../../../core/services/initiative.service';
import { LaunchInitiativeDetailComitteeListsComponent } from './launch-initiative-detail-comittee-lists/launch-initiative-detail-comittee-lists.component';
import { LaunchInitiativeDetailCommitteeMembersComponent } from './launch-initiative-detail-commitee-members/launch-initiative-detail-committee-members.component';

@Component({
  selector: 'app-launch-initiative-detail-committee',
  imports: [
    CardModule,
    ButtonModule,
    SpinnerModule,
    IconModule,
    TableModule,
    TooltipModule,
    IconButtonModule,
    LaunchInitiativeDetailComitteeListsComponent,
    LaunchInitiativeDetailCommitteeMembersComponent,
  ],
  templateUrl: './launch-initiative-detail-committee.component.html',
})
export class LaunchInitiativeDetailCommitteeComponent implements OnDestroy {
  private readonly initiativeService = inject(InitiativeService);

  private readonly routeSubscription: Subscription;

  protected initiative?: Initiative;
  protected committee?: InitiativeCommittee;

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.parent!.data.subscribe(({ initiative }) => this.loadData(initiative));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  private async loadData(initiative: Initiative): Promise<void> {
    this.initiative = initiative;
    this.committee = await this.initiativeService.getCommittee(this.initiative.id);
  }
}
