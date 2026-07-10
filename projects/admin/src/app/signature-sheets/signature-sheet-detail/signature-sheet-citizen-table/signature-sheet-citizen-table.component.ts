/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { AfterViewInit, Component, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  CheckboxModule,
  IconButtonModule,
  SortDirective,
  SpinnerModule,
  StatusLabelModule,
  TableDataSource,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { PersonReviewState } from '../../../core/models/person.model';
import { ConfirmDialogService } from 'ecollecting-lib';
import { CollectionSignatureSheetCitizen } from '../../../core/models/collection.model';

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
export class SignatureSheetCitizenTableComponent implements OnInit, AfterViewInit {
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly officialNameColumn = 'officialName';
  protected readonly firstNameColumn = 'firstName';
  protected readonly dateOfBirthColumn = 'dateOfBirth';
  protected readonly residenceAddressStreetColumn = 'residenceAddressStreet';
  protected readonly residenceAddressHouseNumberColumn = 'residenceAddressHouseNumber';
  protected readonly collectionDateTimeColumn = 'collectionDateTime';
  protected readonly reviewStateColumn = 'reviewState';
  protected readonly actionsColumn = 'actions';

  protected columns = [
    this.officialNameColumn,
    this.firstNameColumn,
    this.dateOfBirthColumn,
    this.residenceAddressStreetColumn,
    this.residenceAddressHouseNumberColumn,
    this.collectionDateTimeColumn,
    this.reviewStateColumn,
    this.actionsColumn,
  ];

  protected readonly dataSource = new TableDataSource<CollectionSignatureSheetCitizen>([]);
  protected readonly reviewStates = PersonReviewState;

  @Input()
  public loadingRegisterId?: string;

  @Input()
  public loading: boolean = true;

  @Output()
  public remove: EventEmitter<CollectionSignatureSheetCitizen> = new EventEmitter<CollectionSignatureSheetCitizen>();

  @Input()
  public canRemove = false;

  @Input()
  public set citizens(v: CollectionSignatureSheetCitizen[]) {
    this.dataSource.data = v;
  }

  @Input()
  public canReview = false;

  @Output()
  public confirm: EventEmitter<CollectionSignatureSheetCitizen> = new EventEmitter<CollectionSignatureSheetCitizen>();

  @Output()
  public revert: EventEmitter<CollectionSignatureSheetCitizen> = new EventEmitter<CollectionSignatureSheetCitizen>();

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  public ngOnInit(): void {
    if (!this.canReview) {
      this.columns = this.columns.filter(x => x !== this.reviewStateColumn);
    }
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  protected async confirmAndRemove(row: CollectionSignatureSheetCitizen): Promise<void> {
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
