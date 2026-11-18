// lib/reports/hooks.ts
// Reports API (backend /api/reports) as TanStack Query hooks. Money arrives as
// 2-decimal strings and is turned into numbers for display only: every total
// shown comes from the server, nothing is summed here.
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// Shapes the report components use (money as numbers)
// ---------------------------------------------------------------------------

/** "YYYY-MM", or a calendar quarter/year that contains today. */
export type ReportPeriod = 'thisQuarter' | 'thisYear' | `${number}-${number}`;

/** The resolved period: its key and first/last day (YYYY-MM-DD). */
export type PeriodRange = { key: string; start: string; end: string };

// income = revenue, cost = cost of sales (in gross profit), expense = operating expense
export type PnlKind = 'income' | 'cost' | 'expense';

export type PnlLineKey = 'salesRevenue' | 'purchases' | 'salaries' | 'rent' | 'utilities' | 'marketing' | 'software';

export type PnlLine = {
  key: PnlLineKey;
  kind: PnlKind;
  /** Always positive; the sign comes from `kind`. */
  amount: number;
};

export type MonthlyPoint = { month: string; revenue: number; expenses: number };

export type TopCustomer = { id: string; name: string; invoicesCount: number; revenue: number };

export type ReportSummary = {
  period: PeriodRange;
  /** The current business month (Cairo), "YYYY-MM". */
  currentMonth: string;
  lines: PnlLine[];
  revenue: number;
  cost: number;
  operating: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  /** Net profit / revenue in whole percent; null without revenue. */
  marginPct: number | null;
  previous: { start: string; end: string; revenue: number; expenses: number; netProfit: number };
  /** Percent change against the previous period; null when it had nothing. */
  change: { revenue: number | null; expenses: number | null; netProfit: number | null };
  /** Cleared payments dated in the period. */
  collected: number;
  series: MonthlyPoint[];
  topCustomers: TopCustomer[];
};

export type AgingBucketKey = 'notDue' | 'd1_30' | 'd31_60' | 'd60plus';

export const AGING_BUCKETS: AgingBucketKey[] = ['notDue', 'd1_30', 'd31_60', 'd60plus'];

export type AgingBucket = { key: AgingBucketKey; amount: number };

export type AgingRow = { id: string; name: string; invoiceCount: number; maxDaysOverdue: number } & Record<
  AgingBucketKey | 'total',
  number
>;

export type AgingReport = {
  /** Today (Cairo), YYYY-MM-DD. */
  asOf: string;
  buckets: AgingBucket[];
  rows: AgingRow[];
  total: number;
  overdue: number;
  overdueCustomers: number;
};

export type VatReport = {
  period: PeriodRange;
  currentMonth: string;
  /** Percent, e.g. 14. */
  rate: number;
  output: number;
  input: number;
  due: number;
  taxableSales: number;
  exemptSales: number;
  invoicesCount: number;
  filingDueDate: string;
};

export type StatementTxn = {
  id: string;
  date: string;
  type: 'invoice' | 'payment';
  ref: string;
  /** The invoice a payment was made on. */
  invoiceRef: string | null;
  amount: number;
  /** Running balance after this row. */
  balance: number;
  /** A cheque that hasn't cleared yet (it already lowers the balance). */
  pending: boolean;
};

export type CustomerStatement = {
  customer: { id: string; name: string };
  period: PeriodRange;
  currentMonth: string;
  opening: number;
  invoiced: number;
  paid: number;
  closing: number;
  txns: StatementTxn[];
};

// ---------------------------------------------------------------------------
// API shapes: the same, with money as strings
// ---------------------------------------------------------------------------

type Money<T, K extends keyof T> = Omit<T, K> & Record<K, string>;

type ApiSummary = Money<
  Omit<ReportSummary, 'lines' | 'previous' | 'series' | 'topCustomers'>,
  'revenue' | 'cost' | 'operating' | 'expenses' | 'grossProfit' | 'netProfit' | 'collected'
> & {
  lines: Money<PnlLine, 'amount'>[];
  previous: Money<ReportSummary['previous'], 'revenue' | 'expenses' | 'netProfit'>;
  series: Money<MonthlyPoint, 'revenue' | 'expenses'>[];
  topCustomers: Money<TopCustomer, 'revenue'>[];
};

type ApiAging = Money<Omit<AgingReport, 'buckets' | 'rows'>, 'total' | 'overdue'> & {
  buckets: Money<AgingBucket, 'amount'>[];
  rows: Money<AgingRow, AgingBucketKey | 'total'>[];
};

type ApiVat = Money<VatReport, 'output' | 'input' | 'due' | 'taxableSales' | 'exemptSales'>;

type ApiStatement = Money<Omit<CustomerStatement, 'txns'>, 'opening' | 'invoiced' | 'paid' | 'closing'> & {
  txns: Money<StatementTxn, 'amount' | 'balance'>[];
};

// ---------------------------------------------------------------------------
// Conversions (display only)
// ---------------------------------------------------------------------------

function toSummary(s: ApiSummary): ReportSummary {
  return {
    ...s,
    lines: s.lines.map((l) => ({ ...l, amount: Number(l.amount) })),
    revenue: Number(s.revenue),
    cost: Number(s.cost),
    operating: Number(s.operating),
    expenses: Number(s.expenses),
    grossProfit: Number(s.grossProfit),
    netProfit: Number(s.netProfit),
    previous: {
      ...s.previous,
      revenue: Number(s.previous.revenue),
      expenses: Number(s.previous.expenses),
      netProfit: Number(s.previous.netProfit),
    },
    collected: Number(s.collected),
    series: s.series.map((p) => ({ month: p.month, revenue: Number(p.revenue), expenses: Number(p.expenses) })),
    topCustomers: s.topCustomers.map((c) => ({ ...c, revenue: Number(c.revenue) })),
  };
}

function toAging(a: ApiAging): AgingReport {
  return {
    ...a,
    buckets: a.buckets.map((b) => ({ key: b.key, amount: Number(b.amount) })),
    rows: a.rows.map((r) => ({
      ...r,
      notDue: Number(r.notDue),
      d1_30: Number(r.d1_30),
      d31_60: Number(r.d31_60),
      d60plus: Number(r.d60plus),
      total: Number(r.total),
    })),
    total: Number(a.total),
    overdue: Number(a.overdue),
  };
}

function toVat(v: ApiVat): VatReport {
  return {
    ...v,
    output: Number(v.output),
    input: Number(v.input),
    due: Number(v.due),
    taxableSales: Number(v.taxableSales),
    exemptSales: Number(v.exemptSales),
  };
}

function toStatement(s: ApiStatement): CustomerStatement {
  return {
    ...s,
    opening: Number(s.opening),
    invoiced: Number(s.invoiced),
    paid: Number(s.paid),
    closing: Number(s.closing),
    txns: s.txns.map((t) => ({ ...t, amount: Number(t.amount), balance: Number(t.balance) })),
  };
}

/** `?period=` when one is chosen; left out = the current month. */
function periodQuery(period: ReportPeriod | null, prefix: '?' | '&' = '?') {
  return period ? `${prefix}period=${encodeURIComponent(period)}` : '';
}

// ---------------------------------------------------------------------------
// Queries: only for roles with the "reports" permission (owner + accountant).
// ---------------------------------------------------------------------------

function useCanSeeReports() {
  return can(useSession().role, 'reports');
}

type QueryOptions = { enabled?: boolean };

export function useReportSummary(period: ReportPeriod | null, opts?: QueryOptions) {
  const allowed = useCanSeeReports();
  return useQuery({
    queryKey: queryKeys.reports.summary(period),
    queryFn: async () =>
      toSummary((await api<{ summary: ApiSummary }>(`/api/reports/summary${periodQuery(period)}`)).summary),
    enabled: allowed && (opts?.enabled ?? true),
  });
}

export function useReportAging(opts?: QueryOptions) {
  const allowed = useCanSeeReports();
  return useQuery({
    queryKey: queryKeys.reports.aging,
    queryFn: async () => toAging((await api<{ aging: ApiAging }>('/api/reports/aging')).aging),
    enabled: allowed && (opts?.enabled ?? true),
  });
}

export function useReportVat(period: ReportPeriod | null, opts?: QueryOptions) {
  const allowed = useCanSeeReports();
  return useQuery({
    queryKey: queryKeys.reports.vat(period),
    queryFn: async () => toVat((await api<{ vat: ApiVat }>(`/api/reports/vat${periodQuery(period)}`)).vat),
    enabled: allowed && (opts?.enabled ?? true),
  });
}

export function useCustomerStatement(customerId: string | null, period: ReportPeriod | null) {
  const allowed = useCanSeeReports();
  return useQuery({
    queryKey: queryKeys.reports.statement(customerId ?? '', period),
    queryFn: async () =>
      toStatement(
        (
          await api<{ statement: ApiStatement }>(
            `/api/reports/statement?customerId=${encodeURIComponent(customerId ?? '')}${periodQuery(period, '&')}`,
          )
        ).statement,
      ),
    enabled: allowed && !!customerId,
  });
}
