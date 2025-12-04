/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Date as ProtoDate } from '@abraxas/voting-ecollecting-proto';

export function getDate(value: string, hour: number, minute: number): Date {
  let date = new Date(value);
  date.setHours(hour, minute);
  return date;
}

export function tomorrowAtStartOfDay(): Date {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function toProtoDate(date: Date | undefined): ProtoDate | undefined {
  if (!date) {
    return undefined;
  }

  return new ProtoDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function fromProtoDate(protoDate: ProtoDate | undefined): Date | undefined {
  if (!protoDate) {
    return undefined;
  }

  return new Date(protoDate.year, protoDate.month - 1, protoDate.day);
}
