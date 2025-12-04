/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { ResolveFn } from '@angular/router';
import { inject, ProviderToken } from '@angular/core';

export function getEntityResolver<T, TService extends EntityGetter<T>>(
  service: ProviderToken<TService>,
  paramName: string = 'id',
): ResolveFn<T> {
  return route => inject(service).get(route.params[paramName]);
}

export interface EntityGetter<T> {
  get(id: string): Promise<T>;
}
