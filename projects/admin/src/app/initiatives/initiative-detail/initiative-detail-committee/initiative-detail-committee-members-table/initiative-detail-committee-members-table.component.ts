/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import {
  ButtonModule,
  IconButtonModule,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { InitiativeCommitteeMember } from '../../../../core/models/initiative.model';

@Component({
  selector: 'app-initiative-detail-committee-members-table',
  templateUrl: './initiative-detail-committee-members-table.component.html',
  styleUrl: './initiative-detail-committee-members-table.component.scss',
  imports: [
    ButtonModule,
    DatePipe,
    IconButtonModule,
    StatusLabelModule,
    TableModule,
    TooltipModule,
    TranslateDirective,
    TranslatePipe,
    TruncateWithTooltipModule,
  ],
})
export class InitiativeDetailCommitteeMembersTableComponent implements OnChanges {
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

  @Input({ required: true })
  public committeeMembers!: InitiativeCommitteeMember[];

  @Input()
  public readonly: boolean = false;

  @Output()
  public verifyClicked = new EventEmitter<InitiativeCommitteeMember>();

  @Output()
  public resetClicked = new EventEmitter<InitiativeCommitteeMember>();

  protected dataSource = new TableDataSource<InitiativeCommitteeMember>();

  public ngOnChanges(): void {
    this.dataSource.data = this.committeeMembers;
  }
}
