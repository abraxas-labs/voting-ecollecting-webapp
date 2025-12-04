/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';
import { Initiative } from '../models/initiative.model';

@Pipe({
  name: 'isInitiative',
})
export class IsInitiativePipe implements PipeTransform {
  public transform(value?: Initiative | any): Initiative | undefined {
    return value?.collection?.type === CollectionType.COLLECTION_TYPE_INITIATIVE ? (value as Initiative) : undefined;
  }
}
