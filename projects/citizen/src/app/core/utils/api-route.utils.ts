/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

const publicRoutePrefix = '/public';
const authenticatedRoutePrefix = '/authenticated';

export function addApiRoutePrefix(path: string, authenticated: boolean): string {
  const routePrefix = authenticated ? authenticatedRoutePrefix : publicRoutePrefix;
  return `${routePrefix}${path.startsWith('/') ? '' : '/'}${path}`;
}
