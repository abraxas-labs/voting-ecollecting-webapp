/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

export function generateSecureRandomString(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return base64urlEncode(bytes);
}

function base64urlEncode(bytes: Uint8Array): string {
  let base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-') // URL-safe
    .replace(/\//g, '_');

  while (base64.endsWith('=')) {
    base64 = base64.slice(0, -1);
  }

  return base64;
}
