/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CheckboxModule,
  SpinnerModule,
  StatusLabelModule,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { CollectionSignatureSheetCandidate } from '../../../core/models/collection.model';
import { emptyPage, Pageable, PaginatorComponent } from 'ecollecting-lib';

@Component({
  selector: 'app-signature-sheet-candidates-table',
  imports: [
    TableModule,
    StatusLabelModule,
    TooltipModule,
    TranslatePipe,
    TruncateWithTooltipModule,
    DatePipe,
    CheckboxModule,
    SpinnerModule,
    PaginatorComponent,
  ],
  templateUrl: './signature-sheet-candidates-table.component.html',
  styleUrl: './signature-sheet-candidates-table.component.scss',
})
export class SignatureSheetCandidatesTableComponent {
  protected readonly signatureColumn = 'signature';
  protected readonly officialNameColumn = 'officialName';
  protected readonly firstNameColumn = 'firstName';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly residenceAddressStreetColumn = 'residenceAddressStreet';
  protected readonly residenceAddressHouseNumberColumn = 'residenceAddressHouseNumber';
  protected readonly isVotingAllowedColumn = 'isVotingAllowed';

  protected readonly columns = [
    this.signatureColumn,
    this.officialNameColumn,
    this.firstNameColumn,
    this.dateOfBirthColumn,
    this.residenceAddressStreetColumn,
    this.residenceAddressHouseNumberColumn,
    this.isVotingAllowedColumn,
  ];

  @Input()
  public candidates = emptyPage<CollectionSignatureSheetCandidate>();

  @Input()
  public loadingRegisterId?: string;

  @Input()
  public canAdd: boolean = false;

  @Output()
  public add: EventEmitter<CollectionSignatureSheetCandidate> = new EventEmitter<CollectionSignatureSheetCandidate>();

  @Output()
  public pageChange: EventEmitter<Pageable> = new EventEmitter<Pageable>();
}
