/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

export function sum(arr?: number[]): number {
  if (!arr) {
    return 0;
  }

  return arr.reduce((result, value) => result + value, 0);
}

export function groupBy<E, K extends keyof any, V>(
  arr: E[],
  keySelector: (item: E) => K,
  itemSelector: (item: E) => V,
): Partial<Record<K, V[]>> {
  return arr.reduce(
    (existing, current) => {
      const key = keySelector(current);
      if (!existing.hasOwnProperty(key)) {
        existing[key] = [];
      }
      existing[key]!.push(itemSelector(current));
      return existing;
    },
    {} as Partial<Record<K, V[]>>,
  );
}

export type SortOrder = 'asc' | 'desc';

export type SortKey<T> = keyof T | { key: keyof T; order: SortOrder };

export function createComparer<T>(...keys: SortKey<T>[]): (a: T, b: T) => number {
  return (a: T, b: T) => {
    for (const k of keys) {
      let key: keyof T;
      let order: SortOrder;

      if (typeof k === 'object' && 'key' in k) {
        key = k.key;
        order = k.order;
      } else {
        key = k;
        order = 'asc';
      }

      const av = a[key] as any;
      const bv = b[key] as any;

      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
    }
    return 0;
  };
}

export function insertSorted<T>(arr: T[], element: T, comparer: (a: T, b: T) => number): T[] {
  let low = 0;
  let high = arr.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (comparer(arr[mid], element) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  arr.splice(low, 0, element);
  return arr;
}
