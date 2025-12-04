/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PageEvent, TableModule, PaginatorComponent as BasePaginatorComponent } from '@abraxas/base-components';
import { defaultPageable, Pageable, PageInfo } from '../models/page.model';

@Component({
  selector: 'vo-ecol-paginator',
  imports: [TableModule],
  templateUrl: './paginator.component.html',
})
export class PaginatorComponent {
  @Output()
  public pageChange: EventEmitter<Pageable> = new EventEmitter<Pageable>();

  @Input()
  public page?: PageInfo;

  @Input()
  public pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  @ViewChild(BasePaginatorComponent, { static: false })
  public paginator!: BasePaginatorComponent;

  protected readonly defaultPage = defaultPageable;

  protected onPageChange(data: PageEvent): void {
    this.pageChange.emit({
      page: data.pageIndex + 1,
      pageSize: data.pageSize,
    });
  }
}
