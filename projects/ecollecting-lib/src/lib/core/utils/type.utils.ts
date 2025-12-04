/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

// DeepRequired<T> makes all nested properties required
export type DeepRequired<T> = T extends object
  ? T extends (...args: any[]) => any
    ? T // don't recurse into functions
    : { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
  : NonNullable<T>;
