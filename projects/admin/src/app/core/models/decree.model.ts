/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Decree as DecreeProto } from '@abraxas/voting-ecollecting-proto/admin';
import { Decree as DecreeShared, fromProtoDate } from 'ecollecting-lib';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { mapReferendumToModel, Referendum } from './referendum.model';

export { DecreeProto };

export interface Decree extends Omit<DecreeShared, 'collections'> {
  collections?: Referendum[];
  userPermissions?: DecreeUserPermissions;
  sensitiveDataExpiryDate?: Date;
}

export interface DecreeUserPermissions {
  canEdit: boolean;
  canFinish: boolean;
  canGenerateDocuments: boolean;
  canAddCollection: boolean;
  canDelete: boolean;
}

export function mapDecreeToModel(decreeProto: DecreeProto, includeCollections: boolean = true): Decree {
  const collections = includeCollections ? decreeProto.collections?.map(x => mapReferendumToModel(x)) : [];
  return {
    ...decreeProto.toObject(),
    collectionStartDate: decreeProto.collectionStartDate?.toDate(),
    collectionEndDate: decreeProto.collectionEndDate?.toDate(),
    sensitiveDataExpiryDate: fromProtoDate(decreeProto.sensitiveDataExpiryDate),
    collections: collections,
  } as Decree;
}

export function newDecree(): Decree {
  return {
    domainOfInfluenceType: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED,
    description: '',
    link: '',
  } as Decree;
}
