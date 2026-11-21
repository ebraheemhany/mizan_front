// lib/quotes/hooks.ts
// Quotes API (backend /api/quotes and the public /api/public/quotes) as TanStack Query
// hooks, plus conversion from the API shape to the shapes the quote components use.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, publicLogoUrl } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// API shapes (money as 2-decimal strings, dates as yyyy-mm-dd)
// ---------------------------------------------------------------------------

/** "expired" is worked out by the server: sent, and past its valid-until date. */
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
/** What the badge shows: a sent quote with a week or less left is "expiring soon". */
export type QuoteDisplayStatus = QuoteStatus | 'expiringSoon';

export const QUOTE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
/** A new quote is valid for two weeks unless the user picks another date. */
export const VALIDITY_DAYS = 14;
/** Sent quotes with this many days left (or fewer) show as "expiring soon". */
export const EXPIRING_DAYS = 7;

/** The invoice a quote was converted to. */
export type QuoteInvoiceRef = { id: string; number: number; displayNumber: string };

export type ApiQuote = {
  id: string;
  number: number;
  displayNumber: string;
  /** null when the customer was deleted. */
  customerId: string | null;
  customer: string;
  issueDate: string;
  validUntil: string;
  total: string;
  status: QuoteStatus;
  daysLeft: number | null;
  invoice: QuoteInvoiceRef | null;
};

type ApiParty = {
  name: string;
  taxNumber: string | null;
  location: string | null;
  email?: string | null;
  phone?: string | null;
  /** The issuer only: its logo's id, or null. */
  logoId?: string | null;
};

export type QuoteEventType = 'created' | 'sent' | 'accepted' | 'rejected' | 'converted';

type ApiQuoteEvent = {
  id: string;
  type: QuoteEventType;
  /** ISO date-time. */
  at: string;
  /** accepted/rejected: { by: 'customer' | 'user' }; converted: { invoiceNumber, displayNumber }. */
  values: Record<string, string | number> | null;
};

/** What the logged-in app and the public link both get. */
type ApiQuoteDocument = Omit<ApiQuote, 'customerId' | 'invoice'> & {
  currency: string;
  issuer: ApiParty & { commercialRegister: string | null };
  client: ApiParty;
  lines: { id: string; title: string; quantity: string; unitPrice: string; amount: string; productId: string | null }[];
  subtotal: string;
  vatRate: string;
  vat: string;
  rounding: string;
  note: string | null;
  sentAt: string | null;
  decidedAt: string | null;
  decidedBy: 'customer' | 'user' | null;
  createdAt: string;
};

export type ApiQuoteDetail = ApiQuoteDocument & {
  customerId: string | null;
  invoice: QuoteInvoiceRef | null;
  /** The public link's token; null while the quote is a draft. */
  publicToken: string | null;
  /** Newest first. */
  history: ApiQuoteEvent[];
};

/**
 * The customer's view (no login): only what the customer reads — no internal ids,
 * token, history, invoice, catalog links or who answered.
 */
export type ApiPublicQuote = Omit<ApiQuoteDocument, 'id' | 'decidedBy' | 'createdAt' | 'lines'> & {
  lines: { id: string; title: string; quantity: string; unitPrice: string; amount: string }[];
};

type ApiQuoteStats = {
  waiting: { count: number; total: string | number };
  accepted: { count: number; total: string | number };
  expiring: { count: number; total: string | number };
  /** Percent (0-100) over the last 90 days; null when nothing was decided. */
  acceptanceRate: number | null;
};

export type QuoteListParams = {
  q?: string;
  status: 'all' | QuoteStatus;
  period: 'all' | 'month' | 'lastMonth' | 'year';
  /** false: only quotes not turned into an invoice yet. */
  converted?: boolean;
  page: number;
  /** At most 100. */
  pageSize: number;
};

export type QuoteListResponse = {
  items: ApiQuote[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<'all' | QuoteStatus, number>;
};

/** What creating or editing a quote sends (numbers as typed; the backend does the math). */
export type QuoteInput = {
  customerId: string;
  issueDate: string;
  validUntil: string;
  items: { description: string; quantity: string; unitPrice: string; productId?: string | null }[];
  notes: string;
};

// ---------------------------------------------------------------------------
// UI shapes (numbers are for display only; all money math is on the backend)
// ---------------------------------------------------------------------------

export type Quote = {
  id: string;
  number: number;
  displayNumber: string;
  customerId: string | null;
  customer: string;
  issueDate: string;
  validUntil: string;
  total: number;
  status: QuoteStatus;
  daysLeft: number | null;
  invoice: QuoteInvoiceRef | null;
};

export type QuoteParty = {
  name: string;
  taxNumber: string;
  location: string;
  email?: string;
  phone?: string;
  /** The issuer's logo, if the company uploaded one. */
  logoUrl?: string;
};

export type QuoteLine = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId: string | null;
};

export type QuoteEvent = { id: string; type: QuoteEventType; at: string; values: Record<string, string | number> };

export type QuoteDetail = Quote & {
  currency: string;
  issuer: QuoteParty;
  client: QuoteParty;
  lines: QuoteLine[];
  subtotal: number;
  vatRate: number;
  vat: number;
  rounding: number;
  note: string;
  publicToken: string | null;
  sentAt: string | null;
  decidedAt: string | null;
  decidedBy: 'customer' | 'user' | null;
  history: QuoteEvent[];
};

export type QuoteStats = {
  waiting: { count: number; total: number };
  accepted: { count: number; total: number };
  expiring: { count: number; total: number };
  acceptanceRate: number | null;
};

export function displayStatus(q: Pick<Quote, 'status' | 'daysLeft'>): QuoteDisplayStatus {
  return q.status === 'sent' && q.daysLeft !== null && q.daysLeft <= EXPIRING_DAYS ? 'expiringSoon' : q.status;
}

export function toUiQuote(row: ApiQuote): Quote {
  return {
    id: row.id,
    number: row.number,
    displayNumber: row.displayNumber,
    customerId: row.customerId,
    customer: row.customer,
    issueDate: row.issueDate,
    validUntil: row.validUntil,
    total: Number(row.total),
    status: row.status,
    daysLeft: row.daysLeft,
    invoice: row.invoice,
  };
}

export function toUiQuoteDetail(d: ApiQuoteDetail | ApiPublicQuote): QuoteDetail {
  const party = (p: ApiParty): QuoteParty => ({
    name: p.name,
    taxNumber: p.taxNumber ?? '',
    location: p.location ?? '',
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    logoUrl: p.logoId ? publicLogoUrl(p.logoId) : undefined,
  });
  const own = 'history' in d ? d : null;
  return {
    ...toUiQuote({
      ...d,
      // The public view has no internal id; the page only needs a stable key.
      id: own?.id ?? `public-${d.number}`,
      customerId: own?.customerId ?? null,
      invoice: own?.invoice ?? null,
    }),
    currency: d.currency,
    issuer: party(d.issuer),
    client: party(d.client),
    lines: d.lines.map((l) => ({
      id: l.id,
      title: l.title,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      amount: Number(l.amount),
      productId: 'productId' in l ? l.productId : null,
    })),
    subtotal: Number(d.subtotal),
    vatRate: Number(d.vatRate),
    vat: Number(d.vat),
    rounding: Number(d.rounding),
    note: d.note ?? '',
    publicToken: own?.publicToken ?? null,
    sentAt: d.sentAt,
    decidedAt: d.decidedAt,
    decidedBy: own?.decidedBy ?? null,
    history: (own?.history ?? []).map((h) => ({ id: h.id, type: h.type, at: h.at, values: h.values ?? {} })),
  };
}

const toStats = (s: ApiQuoteStats): QuoteStats => ({
  waiting: { count: s.waiting.count, total: Number(s.waiting.total) },
  accepted: { count: s.accepted.count, total: Number(s.accepted.total) },
  expiring: { count: s.expiring.count, total: Number(s.expiring.total) },
  acceptanceRate: s.acceptanceRate,
});

function toQueryString(params: Partial<QuoteListParams>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    // 'all' means "no filter" only for the choice filters; a search for the text "all" is sent.
    if (value === 'all' && key !== 'q') continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useQuotesList(params: QuoteListParams, opts?: { enabled?: boolean; staleTime?: number }) {
  return useQuery({
    queryKey: queryKeys.quotes.list(params),
    queryFn: () => api<QuoteListResponse>(`/api/quotes${toQueryString(params)}`),
    placeholderData: keepPreviousData,
    // Spread, not `staleTime: opts?.staleTime`: an explicit undefined would replace the
    // client's default (30s) and make every mount refetch.
    ...opts,
  });
}

export function useQuoteStats() {
  return useQuery({
    queryKey: queryKeys.quotes.stats,
    queryFn: async () => toStats((await api<{ stats: ApiQuoteStats }>('/api/quotes/stats')).stats),
  });
}

const fetchQuote = async (ref: string | number) => (await api<{ quote: ApiQuoteDetail }>(`/api/quotes/${ref}`)).quote;

/** One quote, by its number (/quotes/212) or id. */
export function useQuote(ref: string | number, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.quotes.detail(ref),
    queryFn: () => fetchQuote(ref),
    enabled: opts?.enabled ?? true,
  });
}

/** Loads a quote's full details on demand (e.g. its public link, from the list). */
export function useFetchQuote() {
  const queryClient = useQueryClient();
  return (ref: string | number) =>
    queryClient.fetchQuery({ queryKey: queryKeys.quotes.detail(ref), queryFn: () => fetchQuote(ref) });
}

/** The customer's view of a quote, from its link (no login). */
export function usePublicQuote(token: string) {
  return useQuery({
    queryKey: queryKeys.publicQuote(token),
    queryFn: async () =>
      (await api<{ quote: ApiPublicQuote }>(`/api/public/quotes/${encodeURIComponent(token)}`, { auth: false })).quote,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

type QuoteResponse = { quote: ApiQuoteDetail };

function useAfterQuoteChange() {
  const queryClient = useQueryClient();
  return (quote?: ApiQuoteDetail) => {
    if (quote) {
      queryClient.setQueryData(queryKeys.quotes.detail(quote.number), quote);
      queryClient.setQueryData(queryKeys.quotes.detail(quote.id), quote);
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
  };
}

export function useCreateQuote() {
  const after = useAfterQuoteChange();
  return useMutation({
    mutationFn: async (input: QuoteInput & { send: boolean }) =>
      (await api<QuoteResponse>('/api/quotes', { method: 'POST', body: input })).quote,
    onSuccess: after,
  });
}

/** Replaces a draft (drafts only: 409 QUOTE_NOT_DRAFT otherwise). */
export function useUpdateQuote() {
  const after = useAfterQuoteChange();
  return useMutation({
    mutationFn: async ({ ref, input }: { ref: string | number; input: QuoteInput }) =>
      (await api<QuoteResponse>(`/api/quotes/${ref}`, { method: 'PATCH', body: input })).quote,
    onSuccess: after,
  });
}

/**
 * send: draft -> sent (creates the public link). accept/reject: from sent or expired.
 * duplicate: a new draft dated today (the response is the new quote).
 */
export function useQuoteAction() {
  const after = useAfterQuoteChange();
  return useMutation({
    mutationFn: async ({ kind, ref }: { kind: 'send' | 'accept' | 'reject' | 'duplicate'; ref: string | number }) =>
      (await api<QuoteResponse>(`/api/quotes/${ref}/${kind}`, { method: 'POST' })).quote,
    onSuccess: after,
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ref: string | number) => api<void>(`/api/quotes/${ref}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Lists and stats refresh now. The deleted quote's own page is left right after,
      // so its detail is only marked stale (refetching it now would just be a 404).
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.all,
        predicate: (query) => query.queryKey[1] !== 'detail',
      });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.quotes.all, 'detail'], refetchType: 'none' });
    },
  });
}

/** The customer accepts or rejects from the public link (409 QUOTE_NOT_OPEN when it's not open). */
export function usePublicQuoteAnswer(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answer: 'accept' | 'reject') =>
      (
        await api<{ quote: ApiPublicQuote }>(`/api/public/quotes/${encodeURIComponent(token)}/${answer}`, {
          method: 'POST',
          auth: false,
        })
      ).quote,
    onSuccess: (quote) => queryClient.setQueryData(queryKeys.publicQuote(token), quote),
  });
}
