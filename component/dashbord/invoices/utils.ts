// components/invoices/utils.ts
import type { Invoice, InvoiceStatus } from '@/lib/mock/invoices';

export type StatusFilter = 'all' | InvoiceStatus;
export type Period = 'all' | 'month' | 'lastMonth' | 'year';
export type Sort = 'recent' | 'oldest' | 'amount' | 'due';

export type Filters = {
  status: StatusFilter;
  query: string;
  customer: string; // 'all' أو id العميل
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

/** The toolbar's period names -> the API's. */
export const PERIOD_TO_API = {
  all: 'all',
  month: 'thisMonth',
  lastMonth: 'lastMonth',
  year: 'thisYear',
} as const satisfies Record<Period, string>;

// Filtering, sorting and paging happen on the backend (GET /api/invoices).
export const PAGE_SIZE = 11;

// The same rules the backend enforces, used to show or hide buttons.

export const canRecordPayment = (i: Invoice) =>
  i.remaining > 0 && i.status !== 'draft' && i.status !== 'cancelled';

/** A draft, or a sent/overdue invoice nobody has paid anything on yet. */
export const canCancel = (i: Invoice) =>
  i.status === 'draft' || ((i.status === 'sent' || i.status === 'overdue') && i.remaining === i.total);

export const canSendReminder = (i: Invoice) =>
  i.remaining > 0 &&
  i.status !== 'draft' &&
  i.status !== 'cancelled' &&
  i.status !== 'paid';
