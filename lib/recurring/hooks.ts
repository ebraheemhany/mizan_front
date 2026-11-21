// lib/recurring/hooks.ts
// Recurring invoices API (backend /api/recurring) as TanStack Query hooks.
// The backend makes the invoices on schedule (an hourly job, and right away on the
// start day); the frontend only edits the templates.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';
export type EndMode = 'never' | 'date' | 'count';

export type InvoiceRef = { id: string; number: number; displayNumber: string; issueDate: string };

type ApiRecurring = {
  id: string;
  name: string;
  customerId: string | null;
  customer: string;
  frequency: Frequency;
  /** Per invoice, incl. VAT (2-decimal string). */
  total: string;
  nextDate: string | null;
  generatedCount: number;
  autoSend: boolean;
  status: RecurringStatus;
  endMode: EndMode;
  endDate: string | null;
  occurrences: number | null;
  /** Why the last invoice couldn't be made (an error code); null when fine. */
  lastError?: string | null;
  lastInvoice: InvoiceRef | null;
};

type ApiRecurringDetail = ApiRecurring & {
  startDate: string;
  terms: number;
  notes: string | null;
  lines: { id: string; description: string; quantity: string; unitPrice: string; productId: string | null }[];
  subtotal: string;
  vat: string;
  vatRate: string;
  invoices: { id: string; number: number; displayNumber: string; issueDate: string; total: string; status: string }[];
};

type ApiList = {
  /** The server's business date (Cairo). */
  today: string;
  items: ApiRecurring[];
  counts: Record<'all' | RecurringStatus, number>;
  stats: { mrr: string; active: number; paused: number; upcoming: { count: number; total: string } };
};

export type Recurring = Omit<ApiRecurring, 'total' | 'lastError'> & { total: number; lastError: string | null };

export type RecurringDetail = Recurring &
  Omit<ApiRecurringDetail, keyof ApiRecurring | 'subtotal' | 'vat' | 'vatRate' | 'invoices' | 'lines'> & {
    lines: { description: string; quantity: string; unitPrice: string; productId: string | null }[];
    subtotal: number;
    vat: number;
    vatRate: number;
    invoices: { id: string; number: number; displayNumber: string; issueDate: string; total: number; status: string }[];
  };

export type RecurringList = {
  today: string;
  items: Recurring[];
  counts: ApiList['counts'];
  stats: { mrr: number; active: number; paused: number; upcoming: { count: number; total: number } };
};

/** What creating or editing a template sends (numbers as typed; the backend does the math). */
export type RecurringInput = {
  name: string;
  customerId: string;
  frequency: Frequency;
  startDate: string;
  endMode: EndMode;
  endDate: string | null;
  occurrences: number | null;
  terms: number;
  autoSend: boolean;
  items: { description: string; quantity: string; unitPrice: string; productId: string | null }[];
  notes: string;
};

const toUiRecurring = (r: ApiRecurring): Recurring => ({
  ...r,
  total: Number(r.total),
  lastError: r.lastError ?? null,
});

export function toUiRecurringDetail(d: ApiRecurringDetail): RecurringDetail {
  return {
    ...toUiRecurring(d),
    startDate: d.startDate,
    terms: d.terms,
    notes: d.notes,
    lines: d.lines.map(({ description, quantity, unitPrice, productId }) => ({ description, quantity, unitPrice, productId })),
    subtotal: Number(d.subtotal),
    vat: Number(d.vat),
    vatRate: Number(d.vatRate),
    invoices: d.invoices.map((i) => ({ ...i, total: Number(i.total) })),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export type RecurringListParams = { status: 'all' | RecurringStatus; q: string };

export function useRecurringList(params: RecurringListParams) {
  return useQuery({
    queryKey: queryKeys.recurring.list(params),
    queryFn: async (): Promise<RecurringList> => {
      const search = new URLSearchParams();
      if (params.status !== 'all') search.set('status', params.status);
      if (params.q) search.set('q', params.q.slice(0, 100));
      const qs = search.toString();
      const data = await api<ApiList>(`/api/recurring${qs ? `?${qs}` : ''}`);
      return {
        today: data.today,
        items: data.items.map(toUiRecurring),
        counts: data.counts,
        stats: {
          mrr: Number(data.stats.mrr),
          active: data.stats.active,
          paused: data.stats.paused,
          upcoming: { count: data.stats.upcoming.count, total: Number(data.stats.upcoming.total) },
        },
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useRecurring(id: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.recurring.detail(id),
    queryFn: async () => (await api<{ template: ApiRecurringDetail }>(`/api/recurring/${encodeURIComponent(id)}`)).template,
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// Mutations: a template change can make an invoice right away (start date today,
// or resuming on a scheduled day), so invoices are refreshed too.
// ---------------------------------------------------------------------------

function useAfterRecurringChange() {
  const queryClient = useQueryClient();
  return (template?: ApiRecurringDetail) => {
    if (template) queryClient.setQueryData(queryKeys.recurring.detail(template.id), template);
    void queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
  };
}

export function useSaveRecurring() {
  const after = useAfterRecurringChange();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: RecurringInput }) =>
      (
        await api<{ template: ApiRecurringDetail }>(id ? `/api/recurring/${id}` : '/api/recurring', {
          method: id ? 'PATCH' : 'POST',
          body: input,
        })
      ).template,
    onSuccess: (template) => after(template),
  });
}

export function useRecurringAction() {
  const after = useAfterRecurringChange();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' }) =>
      (await api<{ template: ApiRecurringDetail }>(`/api/recurring/${id}/${action}`, { method: 'POST' })).template,
    onSuccess: (template) => after(template),
  });
}

export function useDeleteRecurring() {
  const after = useAfterRecurringChange();
  return useMutation({
    mutationFn: async (id: string) => {
      await api(`/api/recurring/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => after(),
  });
}
