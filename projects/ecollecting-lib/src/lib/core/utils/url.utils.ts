/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

/**
 * Checks if the given URL is within the base URL, meaning it belongs to the same origin
 * as the base URL and starts with the same path.
 *
 * @param url The URL to check.
 * @param baseUrl The base URL.
 * @returns True if the URL is within the base URL, false otherwise.
 */
export function isUrlWithinBase(url: string, baseUrl: string): boolean {
  if (!url || !baseUrl) {
    return false;
  }

  try {
    const target = new URL(url, window.location.origin);
    const base = new URL(baseUrl, window.location.origin);

    const normalizedBasePath = base.pathname.endsWith('/') ? base.pathname : base.pathname + '/';
    const normalizedTargetPath = target.pathname.endsWith('/') ? target.pathname : target.pathname + '/';

    return target.origin === base.origin && normalizedTargetPath.startsWith(normalizedBasePath);
  } catch (e) {
    // If URL parsing fails, it's safer to assume it's not internal
    return false;
  }
}
