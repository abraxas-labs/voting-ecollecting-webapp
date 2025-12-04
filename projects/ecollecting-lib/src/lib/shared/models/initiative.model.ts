/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Collection, CollectionCount } from './collection.model';
import { CollectionCameNotAboutReason, DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';

export interface InitiativeSubType {
  id: string;
  domainOfInfluenceType: DomainOfInfluenceType;
  description: string;
  minSignatureCount: number;
  maxElectronicSignatureCount: number;
}

export interface Initiative {
  id: string;
  domainOfInfluenceType: DomainOfInfluenceType;
  bfs: string;
  minSignatureCount: number;
  maxElectronicSignatureCount: number;
  wording: string;
  collection: Collection;
  governmentDecisionNumber: string;
  subType?: InitiativeSubType;
  committeeDescription?: string;
  attestedCollectionCount?: CollectionCount;
  cameNotAboutReason?: CollectionCameNotAboutReason;
  lockedFields?: InitiativeLockedFields;
}

export interface InitiativeLockedFields {
  wording: boolean;
  description: boolean;
  committeeMembers: boolean;
}
