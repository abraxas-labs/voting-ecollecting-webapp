/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { CardModule, SpinnerModule } from '@abraxas/base-components';
import { Initiative, InitiativeCommittee } from '../../../core/models/initiative.model';
import { InitiativeDetailCommitteeListsComponent } from './initiative-detail-committee-lists/initiative-detail-committee-lists.component';
import { InitiativeDetailCommitteeMembersComponent } from './initiative-detail-committee-members/initiative-detail-committee-members.component';

@Component({
  selector: 'app-initiative-detail-committee',
  templateUrl: './initiative-detail-committee.component.html',
  imports: [CardModule, InitiativeDetailCommitteeListsComponent, InitiativeDetailCommitteeMembersComponent, SpinnerModule],
})
export class InitiativeDetailCommitteeComponent {
  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;
}
