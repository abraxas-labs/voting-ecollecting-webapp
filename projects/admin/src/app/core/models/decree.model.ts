/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Decree as DecreeProto, GetDecreeForDeleteResponse } from '@abraxas/voting-ecollecting-proto/admin';
import { Decree as DecreeShared, fromProtoDate } from 'ecollecting-lib';
import { DomainOfInfluenceType } from '@abraxas/voting-ecollecting-proto';
import { mapReferendumToModel, Referendum } from './referendum.model';

export { DecreeProto };

export interface Decree extends Omit<DecreeShared, 'collections'> {
  collections?: Referendum[];
  userPermissions?: DecreeUserPermissions;
  sensitiveDataExpiryDate?: Date;
  electronicCollectionEnabled: boolean;
}

export interface DecreeUserPermissions {
  canEdit: boolean;
  canFinish: boolean;
  canGenerateDocuments: boolean;
  canAddCollection: boolean;
  canDelete: boolean;
  canDeleteExpired: boolean;
}

export interface ReferendumDeleteInfo {
  referendum: Referendum;
  creatorName: string;
  creatorEmail: string;
}

export interface DecreeForDeleteResult {
  decree: Decree;
  referendums: ReferendumDeleteInfo[];
}

export function mapDecreeToModel(decreeProto: DecreeProto, includeCollections: boolean = true): Decree {
  const collections = includeCollections ? decreeProto.collections?.map(x => mapReferendumToModel(x)) : [];
  return {
    ...decreeProto.toObject(),
    collectionStartDate: fromProtoDate(decreeProto.collectionStartDate),
    collectionEndDate: fromProtoDate(decreeProto.collectionEndDate),
    sensitiveDataExpiryDate: fromProtoDate(decreeProto.sensitiveDataExpiryDate),
    collections: collections,
  } as Decree;
}

export function mapDecreeForDeleteToModel(resp: GetDecreeForDeleteResponse): DecreeForDeleteResult {
  return {
    decree: mapDecreeToModel(resp.decree!),
    referendums: resp.referendums!.map(r => ({
      referendum: mapReferendumToModel(r.referendum!),
      creatorName: r.creatorFullName,
      creatorEmail: r.creatorEmail,
    })),
  };
}

export function newDecree(): Decree {
  return {
    domainOfInfluenceType: DomainOfInfluenceType.DOMAIN_OF_INFLUENCE_TYPE_UNSPECIFIED,
    description: '',
    link: '',
  } as Decree;
}
