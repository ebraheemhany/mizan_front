// component/dashbord/reports/utils.ts
// Pure helpers (no React, no mock data): the reports page and server page use
// them, and the expenses page uses monthToDate.
import type { ReportPeriod } from '@/lib/reports/hooks';

export const REPORT_TABS = ['pnl', 'balanceSheet', 'cashFlow', 'aging', 'vat', 'statement'] as const;
export type ReportTab = (typeof REPORT_TABS)[number];

/** Tabs that need a general ledger, which doesn't exist yet. */
export const PERIOD_KEYWORDS = ['thisQuarter', 'thisYear'] as const;

// Same rule as the API (years 1000-2999); a month after the current one is refused there.
const MONTH = /^[12]\d{3}-(0[1-9]|1[0-2])$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMonthKey(value: string): value is `${number}-${number}` {
  return MONTH.test(value);
}

export function isReportPeriod(value: string): value is ReportPeriod {
  return (PERIOD_KEYWORDS as readonly string[]).includes(value) || isMonthKey(value);
}

export type ReportsUrlState = {
  tab: ReportTab;
  /** null = the current month (the API's default). */
  period: ReportPeriod | null;
  /** null = the customer with the largest balance. */
  customer: string | null;
};

/** The page's ?tab=&period=&customer=, with anything unknown dropped to the defaults (the URL is the page's state). */
export function parseReportsSearch(search: Record<string, string | string[] | undefined>): ReportsUrlState {
  const one = (key: string) => {
    const value = search[key];
    return (Array.isArray(value) ? value[0] : value) ?? '';
  };
  const tab = one('tab');
  const period = one('period');
  const customer = one('customer');
  return {
    tab: (REPORT_TABS as readonly string[]).includes(tab) ? (tab as ReportTab) : 'pnl',
    period: isReportPeriod(period) ? period : null,
    customer: UUID.test(customer) ? customer : null,
  };
}

/** The query string for the state (defaults left out), without the "?". */
export function reportsSearch({ tab, period, customer }: ReportsUrlState) {
  const search = new URLSearchParams();
  if (tab !== 'pnl') search.set('tab', tab);
  if (period) search.set('period', period);
  // Kept on other tabs too, so going back to the statement shows the same customer.
  if (customer) search.set('customer', customer);
  return search.toString();
}

/** "2026-10" (+ offset months) -> the first of that month, UTC. */
export function monthToDate(ym: string, offset = 0) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + offset, 1));
}

/** "2026-10" + offset months -> "YYYY-MM". */
export function shiftMonthKey(ym: string, offset: number) {
  return monthToDate(ym, offset).toISOString().slice(0, 7) as `${number}-${number}`;
}

/** The last `count` months ending at `month`, newest first. */
export function recentMonths(month: string, count: number) {
  return Array.from({ length: count }, (_, i) => shiftMonthKey(month, -i));
}

/** Today's month in Cairo by this device's clock: only a stand-in until the server's is known. */
export function deviceCairoMonth() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit' })
    .format(new Date())
    .slice(0, 7);
}

/** A round top for a chart scale (1, 2, 2.5 or 5 x a power of ten); 1000 when everything is 0. */
export function niceMax(value: number) {
  if (!(value > 0)) return 1000;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10;
  return step * power;
}
