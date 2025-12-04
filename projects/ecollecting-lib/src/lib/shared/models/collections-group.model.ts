/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { Decree } from './decree.model';
import { Initiative } from './initiative.model';

export interface CollectionsGroup {
  domainOfInfluenceType: DomainOfInfluenceType;
  referendums: Decree[];
  initiatives: Initiative[];
}
