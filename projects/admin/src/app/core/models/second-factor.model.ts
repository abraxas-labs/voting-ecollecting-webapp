/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import {
  SecondFactorTransaction as SecondFactorTransactionProto,
  SecondFactorTransactionNevisInfo as SecondFactorTransactionNevisInfoProto,
  SecondFactorTransactionProvider as SecondFactorTransactionProviderProto,
} from '@abraxas/voting-ecollecting-proto/admin';
import { SecondFactorTransactionProvider } from '@abraxas/voting-lib';

export { SecondFactorTransactionProto, SecondFactorTransactionNevisInfoProto, SecondFactorTransactionProvider };

export interface SecondFactorTransaction extends Omit<SecondFactorTransactionProto.AsObject, 'availableProviders'> {
  availableProviders: SecondFactorTransactionProvider[];
}

export type SecondFactorTransactionNevisInfo = SecondFactorTransactionNevisInfoProto.AsObject;

export function mapToSecondFactorTransaction(proto: SecondFactorTransactionProto): SecondFactorTransaction {
  const obj = proto.toObject();
  return {
    ...obj,
    availableProviders: obj.availableProviders.map(x => {
      switch (x) {
        case SecondFactorTransactionProviderProto.SECOND_FACTOR_TRANSACTION_PROVIDER_NEVIS:
          return SecondFactorTransactionProvider.NEVIS;
        case SecondFactorTransactionProviderProto.SECOND_FACTOR_TRANSACTION_PROVIDER_OTP:
          return SecondFactorTransactionProvider.OTP;
        default:
          return SecondFactorTransactionProvider.UNSPECIFIED;
      }
    }),
  };
}
