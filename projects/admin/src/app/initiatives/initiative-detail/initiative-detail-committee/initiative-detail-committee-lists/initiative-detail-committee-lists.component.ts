/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input, inject } from '@angular/core';
import { StoredFile, FileChipComponent } from 'ecollecting-lib';
import { CardModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { InitiativeService } from '../../../../core/services/initiative.service';
import { Initiative, InitiativeCommittee } from '../../../../core/models/initiative.model';

@Component({
  selector: 'app-initiative-detail-committee-lists',
  templateUrl: './initiative-detail-committee-lists.component.html',
  styleUrls: ['./initiative-detail-committee-lists.component.scss'],
  imports: [FileChipComponent, CardModule, TranslatePipe],
})
export class InitiativeDetailCommitteeListsComponent {
  private readonly initiativeService = inject(InitiativeService);

  @Input({ required: true })
  public initiative!: Initiative;

  @Input({ required: true })
  public committee!: InitiativeCommittee;

  public async openCommitteeList(list: StoredFile): Promise<void> {
    if (!this.initiative) {
      return;
    }

    await this.initiativeService.downloadCommitteeList(this.initiative.id, list.id);
  }
}
