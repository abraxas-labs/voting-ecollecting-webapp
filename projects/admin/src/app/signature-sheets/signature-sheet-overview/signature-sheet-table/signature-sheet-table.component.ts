/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  CheckboxModule,
  DialogService,
  Filter,
  FilterDirective,
  IconButtonModule,
  SelectionChange,
  Sort,
  SortDirective,
  SpinnerModule,
  TableModule,
  TooltipModule,
  TruncateWithTooltipModule,
} from '@abraxas/base-components';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionSignatureSheet } from '../../../core/models/collection.model';
import { CollectionSignatureSheetState, ListSignatureSheetsSort } from '@abraxas/voting-ecollecting-proto/admin';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  defaultPageable,
  emptyPage,
  Page,
  Pageable,
  PaginatorComponent,
  removeItemFromPage,
  ToastService,
} from 'ecollecting-lib';
import { SortDirection } from '@abraxas/voting-ecollecting-proto';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionSignatureSheetService } from '../../../core/services/collection-signature-sheet.service';

interface LabeledValue<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-signature-sheet-table',
  imports: [
    DatePipe,
    TableModule,
    TooltipModule,
    TranslatePipe,
    DecimalPipe,
    SpinnerModule,
    TruncateWithTooltipModule,
    IconButtonModule,
    CheckboxModule,
    PaginatorComponent,
  ],
  providers: [DialogService],
  templateUrl: './signature-sheet-table.component.html',
  styleUrls: ['./signature-sheet-table.component.scss'],
})
export class SignatureSheetTableComponent implements OnInit {
  private readonly datePipe = inject(DatePipe);
  private readonly collectionSignatureSheetService = inject(CollectionSignatureSheetService);
  private readonly dialogService = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly states = CollectionSignatureSheetState;
  protected readonly attestedAtFormat = 'dd.MM.yyyy HH:mm';

  protected readonly selectionColumn = 'selection';
  protected readonly numberColumn = 'number';
  protected readonly dateColumn = 'date';
  protected readonly attestedAtColumn = 'attestedAt';
  protected readonly modifiedByNameColumn = 'modifiedByName';
  protected readonly signatureCountTotalColumn = 'signatureCountTotal';
  protected readonly signatureCountValidColumn = 'signatureCountValid';
  protected readonly signatureCountInvalidColumn = 'signatureCountInvalid';
  protected readonly actionsColumn = 'actions';

  protected columns: string[] = [
    this.selectionColumn,
    this.numberColumn,
    this.dateColumn,
    this.modifiedByNameColumn,
    this.attestedAtColumn,
    this.signatureCountTotalColumn,
    this.signatureCountValidColumn,
    this.signatureCountInvalidColumn,
    this.actionsColumn,
  ];

  protected page: Page<CollectionSignatureSheet> = emptyPage<CollectionSignatureSheet>();
  protected attestedAtValues: LabeledValue<Date>[] = [];
  protected loading: boolean = true;

  @ViewChild(FilterDirective, { static: true })
  public filter!: FilterDirective;

  @ViewChild(PaginatorComponent, { static: false })
  public paginator?: PaginatorComponent;

  @ViewChild(SortDirective, { static: true })
  public sort!: SortDirective;

  @Input({ required: true })
  public collectionId!: string;

  @Input()
  public paged: boolean = false;

  @Input({ required: true })
  public state!: CollectionSignatureSheetState;

  @Output()
  public selectionChange: EventEmitter<CollectionSignatureSheet[]> = new EventEmitter<CollectionSignatureSheet[]>();

  private sortMember: ListSignatureSheetsSort = ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_NUMBER;
  private sortDirection: SortDirection = SortDirection.SORT_DIRECTION_ASCENDING;
  private attestedAtFilters: Date[] = [];

  private readonly columnsSortMapping: Record<string, ListSignatureSheetsSort> = {
    [this.numberColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_NUMBER,
    [this.dateColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_DATE,
    [this.modifiedByNameColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_MODIFIED_OR_CREATED_BY_NAME,
    [this.attestedAtColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_ATTESTED_AT,
    [this.signatureCountTotalColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_COUNT_TOTAL,
    [this.signatureCountValidColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_COUNT_VALID,
    [this.signatureCountInvalidColumn]: ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_COUNT_INVALID,
  };

  public async ngOnInit(): Promise<void> {
    try {
      this.loading = true;

      if (this.state === CollectionSignatureSheetState.COLLECTION_SIGNATURE_SHEET_STATE_CREATED) {
        this.columns = this.columns.filter(x => x !== this.attestedAtColumn);
      } else {
        await this.loadAttestedAtFilter();
      }

      await this.loadData();
    } finally {
      this.loading = false;
    }
  }

  public remove(sheets: CollectionSignatureSheet[]): void {
    const ids = sheets.map(x => x.id);
    this.page.items = this.page.items.filter(x => !ids.includes(x.id));
  }

  public async add(sheets: CollectionSignatureSheet[]): Promise<void> {
    this.remove(sheets);
    this.page.items = [...sheets, ...this.page.items];
    await this.loadAttestedAtFilter();
    await this.loadData();
  }

  protected select(data: SelectionChange<CollectionSignatureSheet>): void {
    this.selectionChange.emit(data.after.map(x => x.value));
  }

  protected async applyFilter(filter: Filter[]): Promise<void> {
    if (filter.length === 0) {
      this.attestedAtFilters = [];
      await this.loadData();
      return;
    }

    if (filter.length > 1 || filter[0].id !== this.attestedAtColumn) {
      throw new Error('only a single attested at filter is supported');
    }

    this.attestedAtFilters = filter[0].value;
    await this.loadData();
  }

  protected async applySort(sorts: Sort[]): Promise<void> {
    if (sorts.length === 0) {
      this.sortMember = ListSignatureSheetsSort.LIST_SIGNATURE_SHEETS_SORT_NUMBER;
      this.sortDirection = SortDirection.SORT_DIRECTION_ASCENDING;
      await this.loadData();
      return;
    }

    if (sorts.length > 1) {
      throw new Error('Cannot support multi-sort.');
    }

    const [sort] = sorts;
    this.sortMember = this.columnsSortMapping[sort.id];
    this.sortDirection = sort.direction === 'desc' ? SortDirection.SORT_DIRECTION_DESCENDING : SortDirection.SORT_DIRECTION_ASCENDING;
    await this.loadData();
  }

  protected async open(id: string): Promise<void> {
    await this.router.navigate([id], { relativeTo: this.route });
  }

  protected async delete(id: string): Promise<void> {
    const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
      title: 'APP.DELETE.TITLE',
      message: 'APP.DELETE.MSG',
      confirmText: 'APP.YES',
      discardText: 'APP.DISCARD',
    } satisfies ConfirmDialogData);

    if (!(await firstValueFrom(dialogRef.afterClosed()))) {
      return;
    }

    await this.collectionSignatureSheetService.delete(this.collectionId, id);
    this.page = removeItemFromPage(this.page, x => x.id == id);
    this.toast.success('APP.DELETED');
  }

  protected async loadData(pageable?: Pageable): Promise<void> {
    if (this.paged && pageable === undefined) {
      pageable = {
        page: defaultPageable.page,
        pageSize: this.page?.pageSize ?? defaultPageable.pageSize,
      };
    }

    this.page = await this.collectionSignatureSheetService.list(
      this.collectionId,
      [this.state],
      this.attestedAtFilters,
      this.sortMember,
      this.sortDirection,
      pageable,
    );
  }

  private async loadAttestedAtFilter(): Promise<void> {
    this.attestedAtValues = (await this.collectionSignatureSheetService.listAttestedAt(this.collectionId)).map(
      x =>
        ({
          label: this.datePipe.transform(x, this.attestedAtFormat)!,
          value: x,
        }) satisfies LabeledValue<Date>,
    );
  }
}
