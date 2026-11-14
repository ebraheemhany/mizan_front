// components/quotes/utils.ts
import { addDaysIso } from '@/lib/iso-date';
import { MOCK_NOW } from '@/lib/mock/invoices';
import {
  displayStatus,
  effectiveStatus,
  quoteLabel,
  RATE_WINDOW_DAYS,
  TODAY,
  type Quote,
  type QuoteStatus,
} from '@/lib/mock/quotes';

export type StatusFilter = 'all' | QuoteStatus;
export type Period = 'all' | 'month' | 'lastMonth' | 'year';

export type Filters = {
  status: StatusFilter;
  query: string;
  period: Period;
};

export const DEFAULT_FILTERS: Filters = { status: 'all', query: '', period: 'all' };

export const PAGE_SIZE = 7;

function inPeriod(iso: string, period: Period) {
  if (period === 'all') return true;

  const d = new Date(`${iso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const ny = MOCK_NOW.getUTCFullYear();
  const nm = MOCK_NOW.getUTCMonth();

  if (period === 'year') return y === ny;
  if (period === 'month') return y === ny && m === nm;

  const last = new Date(Date.UTC(ny, nm - 1, 1));
  return y === last.getUTCFullYear() && m === last.getUTCMonth();
}

export function applyFilters(list: Quote[], f: Filters): Quote[] {
  const q = f.query.trim().toLowerCase().replace(/^#/, '');

  return list
    .filter((x) => {
      if (f.status !== 'all' && effectiveStatus(x) !== f.status) return false;
      if (!inPeriod(x.issueDate, f.period)) return false;
      if (q && !quoteLabel(x.number).toLowerCase().includes(q) && !x.customer.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.number - a.number);
}

export function computeStats(quotes: Quote[]) {
  const sum = (list: Quote[]) => list.reduce((s, x) => s + x.total, 0);

  const waiting = quotes.filter((x) => effectiveStatus(x) === 'sent');
  const expiring = quotes.filter((x) => displayStatus(x) === 'expiringSoon');
  const acceptedThisMonth = quotes.filter(
    (x) => x.status === 'accepted' && x.acceptedDate?.slice(0, 7) === TODAY.slice(0, 7),
  );

  // نسبة القبول: المقبولة من العروض المحسومة (مقبولة أو مرفوضة أو منتهية) آخر 90 يوم
  const from = addDaysIso(TODAY, -RATE_WINDOW_DAYS);
  const decided = quotes.filter(
    (x) =>
      x.issueDate >= from && ['accepted', 'rejected', 'expired'].includes(effectiveStatus(x)),
  );
  const won = decided.filter((x) => effectiveStatus(x) === 'accepted');

  return {
    waiting: { count: waiting.length, total: sum(waiting) },
    accepted: { count: acceptedThisMonth.length, total: sum(acceptedThisMonth) },
    expiring: { count: expiring.length, total: sum(expiring) },
    rate: decided.length ? won.length / decided.length : null,
  };
}