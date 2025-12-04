/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { GrpcStatusEvent } from '@ngx-grpc/common';

export function getGrpcErrorOrThrow(e: any, errTypes: string[]): string {
  if (!(e instanceof GrpcStatusEvent)) {
    throw e;
  }

  for (const errType of errTypes) {
    if (isGrpcError(e, errType)) {
      return errType;
    }
  }

  throw e;
}

export function isGrpcError(e: any, errType: string): boolean {
  return (
    e instanceof GrpcStatusEvent &&
    (e.statusMessage === errType || e.statusMessage.startsWith(errType + ':') || e.statusMessage.startsWith(errType + ' '))
  );
}

export function isGrpcNotFoundError(e: any): boolean {
  return e instanceof GrpcStatusEvent && e.statusCode === 5;
}
