/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

export interface PageInfo {
  currentPage: number;
  pageSize: number;
  totalItemsCount: number;
}

export interface Page<T> extends PageInfo {
  items: T[];
}

export interface Pageable {
  page: number;
  pageSize: number;
}

export const defaultPageable: Pageable = {
  page: 1,
  pageSize: 10,
};

export function emptyPage<T>(): Page<T> {
  return {
    items: [],
    currentPage: defaultPageable.page,
    pageSize: defaultPageable.pageSize,
    totalItemsCount: 0,
  };
}

export function mapToPage<T>(page: PageInfo, items: T[]): Page<T> {
  return {
    ...page,
    items,
  };
}

export function removeItemFromPage<T>(page: Page<T>, toRemovePredicate: (item: T) => boolean): Page<T> {
  const newPage = { ...page };

  const prevLength = page.items.length;
  newPage.items = page.items.filter(x => !toRemovePredicate(x));

  const diff = prevLength - newPage.items.length;
  newPage.totalItemsCount -= diff;
  return newPage;
}
