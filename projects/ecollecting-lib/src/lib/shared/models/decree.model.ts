/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { CollectionCameNotAboutReason, CollectionPeriodState, DecreeState, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { Referendum } from './referendum.model';
import { CollectionCount } from './collection.model';

export interface Decree {
  id: string;
  domainOfInfluenceType: DomainOfInfluenceType;
  bfs: string;
  description: string;
  collectionStartDate?: Date;
  collectionEndDate?: Date;
  minSignatureCount: number;
  maxElectronicSignatureCount: number;
  link: string;
  periodState?: CollectionPeriodState;
  collections?: Referendum[];
  attestedCollectionCount?: CollectionCount;
  state: DecreeState;
  cameNotAboutReason?: CollectionCameNotAboutReason;
  domainOfInfluenceName: string;
}

export interface SimpleDecree {
  id: string;
  description: string;
  minSignatureCount: number;
  maxElectronicSignatureCount: number;
}

export function newSimpleDecree(): SimpleDecree {
  return {
    id: '',
    description: '',
    minSignatureCount: 0,
    maxElectronicSignatureCount: 0,
  } as SimpleDecree;
}
