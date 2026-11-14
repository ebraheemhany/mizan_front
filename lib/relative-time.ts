export function formatDaysAgo(locale: string, days: number) {
  const rtf = new Intl.RelativeTimeFormat(`${locale}-u-nu-latn`, { numeric: 'auto' });
  if (days < 7) return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.round(days / 7), 'week');
  return rtf.format(-Math.round(days / 30), 'month');
}

// بيعرض "بعد 5 أيام" أو "بعد 3 أسابيع" أو "بعد شهرين"
export function formatDaysFromNow(locale: string, days: number) {
  const rtf = new Intl.RelativeTimeFormat(`${locale}-u-nu-latn`, { numeric: 'auto' });
  if (days < 14) return rtf.format(days, 'day');
  if (days < 60) return rtf.format(Math.round(days / 7), 'week');
  return rtf.format(Math.round(days / 30), 'month');
}

export function daysUntil(iso: string, now: Date) {
  const [y, m, d] = iso.split('-').map(Number);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}


