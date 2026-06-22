/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, inject, OnDestroy } from '@angular/core';
import { Initiative, InitiativeCommittee, InitiativeCommitteeMember } from '../../../../../core/models/initiative.model';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DividerModule, TableDataSource, TableModule } from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { InitiativeService } from '../../../../../core/services/initiative.service';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import {
  CollectionPermissionRole,
  CollectionPermissionState,
  InitiativeCommitteeMemberApprovalState,
} from '@abraxas/voting-ecollecting-proto';
import { CollectionService } from '../../../../../core/services/collection.service';
import { CollectionPermission } from '../../../../../core/models/collection.model';

@Component({
  selector: 'app-launch-initiative-detail-committee-list-preview',
  imports: [TableModule, TranslatePipe, DividerModule, DatePipe, NgOptimizedImage],
  templateUrl: './launch-initiative-detail-committee-list-preview.component.html',
  styleUrl: './launch-initiative-detail-committee-list-preview.component.scss',
})
export class LaunchInitiativeDetailCommitteeListsComponent implements OnDestroy {
  protected readonly numberColumn = 'number';
  protected readonly lastNameColumn = 'lastName';
  protected readonly firstNameColumn = 'firstName';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly residenceColumn = 'residence';
  protected readonly signatureColumn = 'signature';
  protected readonly checkColumn = 'check';

  protected readonly columns = [
    this.numberColumn,
    this.lastNameColumn,
    this.firstNameColumn,
    this.dateOfBirthColumn,
    this.residenceColumn,
    this.signatureColumn,
    this.checkColumn,
  ];

  private readonly initiativeService = inject(InitiativeService);
  private readonly collectionService = inject(CollectionService);

  protected readonly approvalStates = InitiativeCommitteeMemberApprovalState;

  protected dataSource = new TableDataSource<InitiativeCommitteeMember>();
  private readonly routeSubscription: Subscription;

  protected initiative?: Initiative;
  protected committee?: InitiativeCommittee;
  protected hasAnyRequestedState = false;
  protected ownerPermission?: CollectionPermission;
  protected deputyPermissions?: CollectionPermission[];

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeSubscription = route.data.subscribe(({ initiative }) => this.loadData(initiative));
  }

  public ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  private async loadData(initiative: Initiative): Promise<void> {
    this.initiative = initiative;
    this.committee = await this.initiativeService.getCommittee(this.initiative.id);
    const permissions = await this.collectionService.listPermissions(this.initiative.id);
    this.ownerPermission = permissions.find(permission => permission.role === CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_OWNER);
    this.deputyPermissions = permissions.filter(
      permission =>
        permission.role === CollectionPermissionRole.COLLECTION_PERMISSION_ROLE_DEPUTY &&
        permission.state === CollectionPermissionState.COLLECTION_PERMISSION_STATE_ACCEPTED,
    );

    this.dataSource.data = this.committee.activeCommitteeMembers;
    this.hasAnyRequestedState = this.dataSource.data.some(
      member => member.approvalState === InitiativeCommitteeMemberApprovalState.INITIATIVE_COMMITTEE_MEMBER_APPROVAL_STATE_REQUESTED,
    );
  }
}
