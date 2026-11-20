// lib/iso-date.ts

// تاريخ محلي من yyyy-mm-dd (للتقويم)
export function fromIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Today's date in Cairo (YYYY-MM-DD) by this device's clock: only a stand-in until the server's is known. */
export function deviceCairoToday() {
  // Built from the parts, so it never depends on a locale's date pattern.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Milliseconds until the next midnight in Cairo by this device's clock (a few seconds
 * late on purpose, so the server's date has already turned). Around a daylight-saving
 * change it can be an hour early; callers that re-check after it fires don't mind.
 */
export function msUntilCairoMidnight() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = (part('hour') * 60 + part('minute')) * 60 + part('second');
  return (24 * 60 * 60 - elapsed) * 1000 + 5_000;
}

export function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const MONTH_STEP = { monthly: 1, quarterly: 3, yearly: 12 } as const;

// بيضيف شهور ويحافظ على اليوم، ولو الشهر أقصر بياخد آخر يوم فيه (31 يناير + شهر = 28 فبراير)
export function addMonthsIso(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

// المواعيد بتتحسب من أول تاريخ كل مرة، علشان اليوم ما يتزحزحش
export function nextOccurrences(start: string, frequency: RecurrenceFrequency, count: number) {
  return Array.from({ length: count }, (_, i) =>
    frequency === 'weekly'
      ? addDaysIso(start, 7 * i)
      : addMonthsIso(start, MONTH_STEP[frequency] * i),
  );
}

