/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { DomainOfInfluence as DomainOfInfluenceProto } from '@abraxas/voting-ecollecting-proto/admin';
import { DomainOfInfluence as DomainOfInfluenceShared, StoredFile } from 'ecollecting-lib';

export interface DomainOfInfluence extends Omit<Required<DomainOfInfluenceProto.AsObject>, 'logo'>, DomainOfInfluenceShared {
  logo?: StoredFile;
}

export function mapToDomainOfInfluence(doi: DomainOfInfluenceProto): DomainOfInfluence {
  const doiObj = doi.toObject();
  return {
    ...doiObj,
    address: doiObj.address!,
    settings: doiObj.settings!,
    logo: doiObj.logo!,
    eCollectingEnabled: doiObj.settings!.eCollectingEnabled,
  };
}
