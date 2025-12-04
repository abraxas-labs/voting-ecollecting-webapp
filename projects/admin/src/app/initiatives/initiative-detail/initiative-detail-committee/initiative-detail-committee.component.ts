/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, OnInit, inject } from '@angular/core';
import { CardModule, SpinnerModule } from '@abraxas/base-components';
import { InitiativeService } from '../../../core/services/initiative.service';
import { Initiative, InitiativeCommittee } from '../../../core/models/initiative.model';
import { InitiativeDetailCommitteeListsComponent } from './initiative-detail-committee-lists/initiative-detail-committee-lists.component';
import { InitiativeDetailCommitteeMembersComponent } from './initiative-detail-committee-members/initiative-detail-committee-members.component';

@Component({
  selector: 'app-initiative-detail-committee',
  templateUrl: './initiative-detail-committee.component.html',
  imports: [CardModule, InitiativeDetailCommitteeListsComponent, InitiativeDetailCommitteeMembersComponent, SpinnerModule],
})
export class InitiativeDetailCommitteeComponent implements OnInit {
  private readonly initiativeService = inject(InitiativeService);

  @Input({ required: true })
  public initiative!: Initiative;

  protected committee?: InitiativeCommittee;

  public async ngOnInit(): Promise<void> {
    this.committee = await this.initiativeService.getCommittee(this.initiative.id);
  }
}
