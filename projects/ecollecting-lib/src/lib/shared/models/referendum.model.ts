/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Collection } from './collection.model';
import { SimpleDecree } from './decree.model';

export interface Referendum {
  id: string;
  decree?: SimpleDecree;
  collection: Collection;
  membersCommittee: string;
}
