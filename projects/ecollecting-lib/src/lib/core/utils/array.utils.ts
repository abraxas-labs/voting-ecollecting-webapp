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
