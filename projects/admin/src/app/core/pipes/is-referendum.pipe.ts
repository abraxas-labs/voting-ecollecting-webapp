/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { Referendum } from '../models/referendum.model';
import { CollectionType } from '@abraxas/voting-ecollecting-proto';

@Pipe({
  name: 'isReferendum',
})
export class IsReferendumPipe implements PipeTransform {
  public transform(value?: Referendum | any): Referendum | undefined {
    return value?.collection?.type === CollectionType.COLLECTION_TYPE_REFERENDUM ? (value as Referendum) : undefined;
  }
}
