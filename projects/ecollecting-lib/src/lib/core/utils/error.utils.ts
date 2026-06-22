/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { GrpcStatusEvent } from '@ngx-grpc/common';
import { isErrorType } from '@abraxas/voting-lib';

export function getGrpcErrorOrThrow(e: any, errTypes: string[]): string {
  for (const errType of errTypes) {
    if (isGrpcError(e, errType)) {
      return errType;
    }
  }

  throw e;
}

export function isGrpcError(e: any, errType: string): boolean {
  // the grpc errors get mapped to the lib error in the interceptor
  return isErrorType(e, errType);
}

export function isGrpcNotFoundError(e: any): boolean {
  return e instanceof GrpcStatusEvent && e.statusCode === 5;
}
