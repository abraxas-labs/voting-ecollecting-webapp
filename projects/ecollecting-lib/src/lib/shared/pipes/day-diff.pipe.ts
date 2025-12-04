/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment/moment';

@Pipe({
  name: 'dayDiff',
})
export class DayDiffPipe implements PipeTransform {
  public transform(from?: Date, to?: Date): number {
    if (!from || !to) {
      return 0;
    }

    return moment(from).diff(moment(to).startOf('day'), 'days');
  }
}
