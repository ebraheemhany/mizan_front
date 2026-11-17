// lib/invoices/hooks.ts
// Invoices API (backend /api/invoices) as TanStack Query hooks, plus conversion
// from the API shape to the shapes the existing invoice components use.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { HistoryEvent, InvoiceDetail } from '@/lib/mock/invoice-details';
import type { Invoice, InvoiceStatus } from '@/lib/mock/invoices';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// API shapes (money as 2-decimal strings, dates as yyyy-mm-dd)
// ---------------------------------------------------------------------------

export type ApiInvoice = {
  id: string;
  number: number;
  displayNumber: string;
  customerId: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  total: string;
  remaining: string;
  status: InvoiceStatus;
  daysOverdue: number | null;
};

type ApiParty = {
  name: string;
  taxNumber: string | null;
  location: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ApiInvoiceDetail = ApiInvoice & {
  terms: number;
  currency: string;
  issuer: ApiParty & { commercialRegister: string | null };
  client: ApiParty;
  lines: { id: string; title: string; quantity: string; unitPrice: string; amount: string; productId: string | null }[];
  subtotal: string;
  vatRate: string;
  vat: string;
  rounding: string;
  note: string | null;
  payments: { id: string; amount: string; date: string; method: 'cash' | 'bank' | 'card'; note: string | null }[];
  /** Only for logged-in users (not on the public link). */
  publicToken?: string | null;
  history?: { id: string; type: HistoryEvent['type']; at: string; values: Record<string, string | number> }[];
};

export type InvoiceStatsData = {
  outstanding: number;
  unpaidCount: number;
  overdue: number;
  overdueCount: number;
  collectedThisMonth: number;
  collectedChangePct: number;
  draftsCount: number;
  draftsValue: number;
};

type ApiStats = Omit<InvoiceStatsData, 'outstanding' | 'overdue' | 'collectedThisMonth' | 'draftsValue' | 'collectedChangePct'> & {
  outstanding: string;
  overdue: string;
  collectedThisMonth: string;
  draftsValue: string;
  collectedChangePct: number | null;
};

export type InvoiceListParams = {
  q?: string;
  status: 'all' | InvoiceStatus;
  customerId?: string;
  period: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear';
  sort: 'recent' | 'oldest' | 'amount' | 'due';
  page: number;
  pageSize: number;
};

type InvoiceListResponse = {
  items: ApiInvoice[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<'all' | InvoiceStatus, number>;
};

export type NewInvoiceInput = {
  customerId: string;
  issueDate: string;
  terms: number;
  items: { description: string; quantity: string; unitPrice: string }[];
  notes: string;
  /** true = issue now; false = save as a draft. */
  send: boolean;
};

// ---------------------------------------------------------------------------
// Conversions (numbers are for display only; all money math is on the backend)
// ---------------------------------------------------------------------------

export function toUiInvoice(row: ApiInvoice): Invoice {
  return {
    id: row.id,
    number: row.number,
    customer: row.customer,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    total: Number(row.total),
    remaining: Number(row.remaining),
    status: row.status,
    daysOverdue: row.daysOverdue ?? undefined,
  };
}

export function toUiDetail(d: ApiInvoiceDetail): InvoiceDetail {
  const party = (p: ApiParty) => ({
    name: p.name,
    taxNumber: p.taxNumber ?? '',
    location: p.location ?? '',
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
  });
  return {
    ...toUiInvoice(d),
    issuer: party(d.issuer),
    client: party(d.client),
    lines: d.lines.map((l) => ({ id: l.id, title: l.title, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
    subtotal: Number(d.subtotal),
    vatRate: Number(d.vatRate),
    vat: Number(d.vat),
    rounding: Number(d.rounding),
    note: d.note ?? '',
    payments: d.payments.map((p) => ({ id: p.id, amount: Number(p.amount), date: p.date, method: p.method, note: p.note ?? undefined })),
    history: (d.history ?? []).map((h) => ({ id: h.id, type: h.type, at: h.at, values: h.values })),
  };
}

const toStats = (s: ApiStats): InvoiceStatsData => ({
  ...s,
  outstanding: Number(s.outstanding),
  overdue: Number(s.overdue),
  collectedThisMonth: Number(s.collectedThisMonth),
  draftsValue: Number(s.draftsValue),
  collectedChangePct: s.collectedChangePct ?? 0,
});

function toQueryString(params: Partial<InvoiceListParams>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => api<InvoiceListResponse>(`/api/invoices${toQueryString(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: queryKeys.invoices.stats,
    queryFn: async () => toStats((await api<{ stats: ApiStats }>('/api/invoices/stats')).stats),
  });
}

const fetchInvoice = async (ref: string | number) =>
  (await api<{ invoice: ApiInvoiceDetail }>(`/api/invoices/${ref}`)).invoice;

/** One invoice, by its number (/invoices/1044) or id. */
export function useInvoice(ref: string | number) {
  return useQuery({ queryKey: queryKeys.invoices.detail(ref), queryFn: () => fetchInvoice(ref) });
}

/** Loads an invoice's full details on demand (print or remind from the list). */
export function useFetchInvoice() {
  const queryClient = useQueryClient();
  return (ref: string | number) =>
    queryClient.fetchQuery({ queryKey: queryKeys.invoices.detail(ref), queryFn: () => fetchInvoice(ref) });
}

export async function fetchInvoicesForExport(params: Omit<InvoiceListParams, 'page' | 'pageSize'>) {
  const { items } = await api<{ items: ApiInvoice[] }>(`/api/invoices/export${toQueryString(params)}`);
  return items;
}

export function usePublicInvoice(token: string) {
  return useQuery({
    queryKey: queryKeys.publicInvoice(token),
    queryFn: async () =>
      (await api<{ invoice: ApiInvoiceDetail }>(`/api/public/invoices/${token}`, { auth: false })).invoice,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Mutations: invoices change customers' balances too, so both are refreshed.
// ---------------------------------------------------------------------------

function useAfterInvoiceChange() {
  const queryClient = useQueryClient();
  return (invoice?: ApiInvoiceDetail) => {
    if (invoice) {
      queryClient.setQueryData(queryKeys.invoices.detail(invoice.number), invoice);
      queryClient.setQueryData(queryKeys.invoices.detail(invoice.id), invoice);
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
  };
}

type InvoiceResponse = { invoice: ApiInvoiceDetail };

export function useCreateInvoice() {
  const after = useAfterInvoiceChange();
  return useMutation({
    mutationFn: async (input: NewInvoiceInput) =>
      (await api<InvoiceResponse>('/api/invoices', { method: 'POST', body: input })).invoice,
    onSuccess: after,
  });
}

/** Actions on one invoice: send (issue a draft), cancel, payment, reminder. */
export function useInvoiceAction() {
  const after = useAfterInvoiceChange();
  return useMutation({
    mutationFn: async (
      action:
        | { kind: 'send'; ref: string | number }
        | { kind: 'cancel'; ref: string | number }
        | { kind: 'payment'; ref: string | number; body: { amount: string; date: string; method: string; note: string } }
        | { kind: 'reminder'; ref: string | number; body: { channel: string; recipient: string; message: string } },
    ) => {
      const path = {
        send: 'send',
        cancel: 'cancel',
        payment: 'payments',
        reminder: 'reminders',
      }[action.kind];
      const body = 'body' in action ? action.body : undefined;
      return (await api<InvoiceResponse>(`/api/invoices/${action.ref}/${path}`, { method: 'POST', body })).invoice;
    },
    onSuccess: after,
  });
}

export function useBulkCancelInvoices() {
  const after = useAfterInvoiceChange();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api<{ cancelled: number; skipped: number }>('/api/invoices/bulk-cancel', { method: 'POST', body: { ids } }),
    onSuccess: () => after(),
  });
}
