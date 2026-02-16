/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { IconButtonModule, StatusLabelModule, TableDataSource, TableModule, TruncateWithTooltipModule } from '@abraxas/base-components';
import { InitiativeCommitteeMember } from '../../../../../core/models/initiative.model';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-launch-initiative-detail-committee-members-table',
  imports: [
    TableModule,
    TranslatePipe,
    CdkDropList,
    TruncateWithTooltipModule,
    DatePipe,
    StatusLabelModule,
    IconButtonModule,
    CdkDrag,
    CdkDragPreview,
  ],
  templateUrl: './launch-initiative-detail-committee-members-table.component.html',
  styleUrl: './launch-initiative-detail-committee-members-table.component.scss',
})
export class LaunchInitiativeDetailCommitteeMembersTableComponent implements OnChanges {
  protected readonly lastNameColumn = 'lastName';
  protected readonly firstNameColumn = 'firstName';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly streetColumn = 'street';
  protected readonly houseNumberColumn = 'houseNumber';
  protected readonly zipCodeColumn = 'zipCode';
  protected readonly residenceColumn = 'residence';
  protected readonly signatureTypeColumn = 'signatureType';
  protected readonly stateColumn = 'state';
  protected readonly actionsColumn = 'actions';
  protected readonly columns = [
    this.lastNameColumn,
    this.firstNameColumn,
    this.dateOfBirthColumn,
    this.streetColumn,
    this.houseNumberColumn,
    this.zipCodeColumn,
    this.residenceColumn,
    this.signatureTypeColumn,
    this.stateColumn,
    this.actionsColumn,
  ];

  @Input()
  public dragDisabled: boolean = false;

  @Input()
  public readonly: boolean = false;

  @Input()
  public canRemove: boolean = false;

  @Input({ required: true })
  public committeeMembers!: InitiativeCommitteeMember[];

  @Output()
  public editClicked = new EventEmitter<InitiativeCommitteeMember>();

  @Output()
  public resendClicked = new EventEmitter<InitiativeCommitteeMember>();

  @Output()
  public removedClicked = new EventEmitter<InitiativeCommitteeMember>();

  @Output()
  public sortChanged = new EventEmitter<CdkDragDrop<InitiativeCommitteeMember, InitiativeCommitteeMember, InitiativeCommitteeMember>>();

  protected dataSource = new TableDataSource<InitiativeCommitteeMember>();

  public ngOnChanges(): void {
    this.dataSource.data = this.committeeMembers;
  }
}
