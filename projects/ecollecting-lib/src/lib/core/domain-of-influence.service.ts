/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DomainOfInfluence } from '../shared/models/domain-of-influence.model';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { InjectionToken } from '@angular/core';

export const DOMAIN_OF_INFLUENCE_SERVICE_TOKEN = new InjectionToken<DomainOfInfluenceService>('DomainOfInfluenceService');

export interface DomainOfInfluenceService<T extends DomainOfInfluence = DomainOfInfluence> {
  list(eCollectingEnabled?: boolean, doiTypes?: DomainOfInfluenceType[]): Promise<T[]>;
}
