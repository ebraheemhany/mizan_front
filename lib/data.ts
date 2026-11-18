// lib/date.ts
'use client';

import { useFormatter } from 'next-intl';

export function useDate() {
  const format = useFormatter();

  // التاريخ بييجي yyyy-mm-dd، والـ UTC علشان اليوم ما يتغيّرش حسب المنطقة الزمنية
  return (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });
}


// بتعرض التاريخ بس لو القيمة yyyy-mm-dd، والتاريخ والوقت لو ISO كامل
export function useDateTime() {
  const format = useFormatter();

  return (value: string) => {
    const hasTime = value.includes('T');
    const d = new Date(hasTime ? value : `${value}T00:00:00Z`);
    // A plain date is shown as is; a real moment (from the API, in UTC) in Egypt's time.
    const timeZone = hasTime ? 'Africa/Cairo' : 'UTC';

    const day = format.dateTime(d, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone,
    });
    if (!hasTime) return day;

    const time = format.dateTime(d, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      numberingSystem: 'latn',
      timeZone,
    });
    return `${day} · ${time}`;
  };
}
