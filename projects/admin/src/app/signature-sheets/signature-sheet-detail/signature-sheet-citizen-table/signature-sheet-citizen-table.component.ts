/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import {
  CheckboxModule,
  IconButtonModule,
  SpinnerModule,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Person, PersonReviewState } from '../../../core/models/person.model';
import { ConfirmDialogService } from 'ecollecting-lib';

@Component({
  selector: 'app-signature-sheet-citizen-table',
  imports: [
    TableModule,
    StatusLabelModule,
    TooltipModule,
    TranslatePipe,
    TruncateWithTooltipModule,
    DatePipe,
    CheckboxModule,
    SpinnerModule,
    IconButtonModule,
  ],
  templateUrl: './signature-sheet-citizen-table.component.html',
  styleUrl: './signature-sheet-citizen-table.component.scss',
})
export class SignatureSheetCitizenTableComponent implements OnInit {
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly officialNameColumn = 'officialName';
  protected readonly firstNameColumn = 'firstName';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly residenceAddressStreetColumn = 'residenceAddressStreet';
  protected readonly residenceAddressHouseNumberColumn = 'residenceAddressHouseNumber';
  protected readonly stateColumn = 'state';
  protected readonly actionsColumn = 'actions';

  protected columns = [
    this.officialNameColumn,
    this.firstNameColumn,
    this.dateOfBirthColumn,
    this.residenceAddressStreetColumn,
    this.residenceAddressHouseNumberColumn,
    this.stateColumn,
    this.actionsColumn,
  ];

  protected readonly dataSource = new TableDataSource<Person>([]);
  protected readonly reviewStates = PersonReviewState;

  @Input()
  public loadingRegisterId?: string;

  @Input()
  public loading: boolean = true;

  @Output()
  public remove: EventEmitter<Person> = new EventEmitter<Person>();

  @Input()
  public canRemove = false;

  @Input()
  public set citizens(v: Person[]) {
    this.dataSource.data = v;
  }

  @Input()
  public canReview = false;

  @Output()
  public confirm: EventEmitter<Person> = new EventEmitter<Person>();

  @Output()
  public revert: EventEmitter<Person> = new EventEmitter<Person>();

  public ngOnInit(): void {
    if (!this.canReview) {
      this.columns = this.columns.filter(x => x !== this.stateColumn);
    }
  }

  protected async confirmAndRemove(row: Person): Promise<void> {
    const ok = await this.confirmDialogService.confirm({
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    });
    if (!ok) {
      return;
    }

    this.remove.emit(row);
  }
}
