/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

const encoder = new TextEncoder();

export async function sha256(str: string): Promise<string> {
  const buffer = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // hash as hex
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
