/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

// Builds the scope for the authentication config.
// The apps scope is required to satisfy a secure connect constraint,
// so the backend is able to read the roles of both apps.
import { AUDIENCE_CLIENTID_PREFIX, DEFAULT_SCOPE } from '@abraxas/base-components';

export function buildScope(clientId: string, clientIdentity: string, clientPermission: string): string {
  return `${DEFAULT_SCOPE} offline_access ${AUDIENCE_CLIENTID_PREFIX}${clientId} ${AUDIENCE_CLIENTID_PREFIX}${clientIdentity} ${AUDIENCE_CLIENTID_PREFIX}${clientPermission}`;
}
