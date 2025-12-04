/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';

@Pipe({
  name: 'routeData',
})
export class RouteDataPipe implements PipeTransform {
  public transform(route: ActivatedRouteSnapshot, key: string): unknown {
    let current: ActivatedRouteSnapshot | null = route;

    while (current.firstChild) {
      current = current.firstChild;
    }

    while (current && current.data?.[key] === undefined) {
      current = current.parent;
    }

    return current?.data?.[key];
  }
}
