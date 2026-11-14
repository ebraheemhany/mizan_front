// components/invoices/utils.ts
import { MOCK_NOW, type Invoice, type InvoiceStatus } from '@/lib/mock/invoices';

export type StatusFilter = 'all' | InvoiceStatus;
export type Period = 'all' | 'month' | 'lastMonth' | 'year';
export type Sort = 'recent' | 'oldest' | 'amount' | 'due';

export type Filters = {
  status: StatusFilter;
  query: string;
  customer: string; // 'all' أو اسم العميل
  period: Period;
  sort: Sort;
};

export const DEFAULT_FILTERS: Filters = {
  status: 'all',
  query: '',
  customer: 'all',
  period: 'all',
  sort: 'recent',
};

const SORTERS: Record<Sort, (a: Invoice, b: Invoice) => number> = {
  recent: (a, b) => b.number - a.number,
  oldest: (a, b) => a.number - b.number,
  amount: (a, b) => b.total - a.total,
  due: (a, b) => a.dueDate.localeCompare(b.dueDate),
};

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

export const PAGE_SIZE = 11;

export function applyFilters(list: Invoice[], f: Filters): Invoice[] {
  const q = f.query.trim().toLowerCase().replace(/^#/, '');

  return list
    .filter((i) => {
      if (f.status !== 'all' && i.status !== f.status) return false;
      if (f.customer !== 'all' && i.customer !== f.customer) return false;
      if (!inPeriod(i.issueDate, f.period)) return false;
      if (q && !String(i.number).includes(q) && !i.customer.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort(SORTERS[f.sort]);
}

export const canRecordPayment = (i: Invoice) =>
  i.remaining > 0 && i.status !== 'draft' && i.status !== 'cancelled';

export const canCancel = (i: Invoice) =>
  i.status === 'draft' || i.status === 'sent' || i.status === 'overdue';

export const canSendReminder = (i: Invoice) =>
  i.remaining > 0 &&
  i.status !== 'draft' &&
  i.status !== 'cancelled' &&
  i.status !== 'paid';








