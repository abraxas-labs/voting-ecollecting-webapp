/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DomainOfInfluence as DomainOfInfluenceProto } from '@abraxas/voting-ecollecting-proto/citizen';
import { DomainOfInfluence as SharedDomainOfInfluence } from 'ecollecting-lib';

export { DomainOfInfluenceProto };

export interface DomainOfInfluence extends SharedDomainOfInfluence, DomainOfInfluenceProto.AsObject {}
