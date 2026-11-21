// lib/ledger/hooks.ts
// The books (backend /api/ledger) as TanStack Query hooks: chart of accounts,
// journal, trial balance, manual entries and closing months. Entries from
// invoices, payments and expenses are worked out by the server from the
// documents; only manual entries are written here.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export const ACCOUNT_TYPES: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

/** A built-in account has a key (its name comes from Accounts.names); an added one has a name. */
export type AccountRef = { id: string; code: string; key: string | null; name: string | null; type: AccountType };
export type LedgerAccount = AccountRef & { system: boolean; balance: number; used: boolean };

export type EntrySource = 'invoice' | 'payment' | 'chequeCleared' | 'expense' | 'expensePayment' | 'manual';
export type EntryStatus = 'posted' | 'draft';
/** The journal's source filter: payments include cheques clearing; expenses include paying a due one. */
export type SourceFilter = 'all' | 'invoice' | 'payment' | 'expense' | 'manual';
export const SOURCE_FILTERS: Exclude<SourceFilter, 'all'>[] = ['invoice', 'payment', 'expense', 'manual'];

export type JournalLine = AccountRef & { debit: number; credit: number };
export type JournalEntry = {
  source: EntrySource;
  id: string;
  date: string;
  status: EntryStatus;
  amount: number;
  /** INV-1042, PAY-0012 or JE-0003 (none for expenses). */
  ref: string | null;
  /** The expense title or the manual entry's text. */
  memo: string | null;
  /** The customer or vendor. */
  party: string | null;
  invoice: { number: number; displayNumber: string } | null;
  method: string | null;
  category: string | null;
  lines: JournalLine[];
};

export type JournalParams = {
  q: string;
  source: SourceFilter;
  status: 'all' | EntryStatus;
  month: string | null;
  page: number;
  pageSize: number;
};
export type JournalPage = { items: JournalEntry[]; total: number; page: number; pageSize: number };

export type TrialBalance = {
  month: string;
  rows: { account: AccountRef; debit: number; credit: number }[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  drafts: number;
  /** Months with anything in the books, newest first. */
  months: string[];
};

export type Periods = {
  today: string;
  /** Everything up to this day is closed. */
  closedThrough: string | null;
  closedAt: string | null;
  /** Open months, newest first (this month is not "ended" yet). */
  open: { month: string; ended: boolean; drafts: number }[];
  /** The month that can be closed now (last month, if still open). */
  toClose: string | null;
  /** Cheques still waiting to clear, dated in what closing would close. */
  pendingCheques: number;
  fiscalYear: { start: string; end: string };
};

export type EntryInput = {
  date: string;
  memo: string;
  status: EntryStatus;
  lines: { accountId: string; debit: string; credit: string }[];
};
export type AccountInput = { code: string; name: string; type: AccountType };

type ApiAccount = Omit<LedgerAccount, 'balance'> & { balance: string };
type ApiLine = AccountRef & { debit: string; credit: string };
type ApiEntry = Omit<JournalEntry, 'amount' | 'lines'> & { amount: string; lines: ApiLine[] };
type ApiTrial = Omit<TrialBalance, 'rows' | 'totalDebit' | 'totalCredit'> & {
  rows: { account: AccountRef; debit: string; credit: string }[];
  totalDebit: string;
  totalCredit: string;
};

const toUiAccount = (a: ApiAccount): LedgerAccount => ({ ...a, balance: Number(a.balance) });
export const toUiEntry = (e: ApiEntry): JournalEntry => ({
  ...e,
  amount: Number(e.amount),
  lines: e.lines.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useLedgerAccounts(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.ledger.accounts,
    queryFn: async () => (await api<{ accounts: ApiAccount[] }>('/api/ledger/accounts')).accounts.map(toUiAccount),
    ...opts,
  });
}

export function useJournal(params: JournalParams, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.ledger.entries(params),
    queryFn: async (): Promise<JournalPage> => {
      const search = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
      if (params.q) search.set('q', params.q.slice(0, 100));
      if (params.source !== 'all') search.set('source', params.source);
      if (params.status !== 'all') search.set('status', params.status);
      if (params.month) search.set('month', params.month);
      const data = await api<Omit<JournalPage, 'items'> & { items: ApiEntry[] }>(`/api/ledger/entries?${search}`);
      return { ...data, items: data.items.map(toUiEntry) };
    },
    placeholderData: keepPreviousData,
    ...opts,
  });
}

/** `month`: "YYYY-MM" (that month's movements) or "all" (every balance to date). */
export function useTrialBalance(month: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.ledger.trial(month),
    queryFn: async (): Promise<TrialBalance> => {
      const data = await api<ApiTrial>(`/api/ledger/trial-balance?month=${encodeURIComponent(month)}`);
      return {
        ...data,
        rows: data.rows.map((r) => ({ account: r.account, debit: Number(r.debit), credit: Number(r.credit) })),
        totalDebit: Number(data.totalDebit),
        totalCredit: Number(data.totalCredit),
      };
    },
    placeholderData: keepPreviousData,
    ...opts,
  });
}

export function usePeriods(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.ledger.periods,
    queryFn: () => api<Periods>('/api/ledger/periods'),
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// Mutations: everything in the books depends on everything else (balances,
// trial balance, periods), so each change refreshes the whole ledger, and the
// reports (the balance sheet reads the books).
// ---------------------------------------------------------------------------

function useAfterLedgerChange() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  };
}

export function useSaveEntry() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: EntryInput }) =>
      toUiEntry(
        (
          await api<{ entry: ApiEntry }>(id ? `/api/ledger/entries/${id}` : '/api/ledger/entries', {
            method: id ? 'PATCH' : 'POST',
            body: input,
          })
        ).entry,
      ),
    onSuccess: after,
  });
}

export function usePostEntry() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: async (id: string) =>
      toUiEntry((await api<{ entry: ApiEntry }>(`/api/ledger/entries/${id}/post`, { method: 'POST' })).entry),
    onSuccess: after,
  });
}

export function useDeleteEntry() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: async (id: string) => {
      await api(`/api/ledger/entries/${id}`, { method: 'DELETE' });
    },
    onSuccess: after,
  });
}

export function usePostDrafts() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: (month: string) =>
      api<{ posted: number }>('/api/ledger/entries/post-drafts', { method: 'POST', body: { month } }),
    onSuccess: after,
  });
}

export function useClosePeriod() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: (month: string) => api<Periods>('/api/ledger/periods/close', { method: 'POST', body: { month } }),
    onSuccess: after,
  });
}

export function useReopenPeriod() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: () => api<Periods>('/api/ledger/periods/reopen', { method: 'POST' }),
    onSuccess: after,
  });
}

export function useSaveAccount() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: AccountInput }) =>
      toUiAccount(
        (
          await api<{ account: ApiAccount }>(id ? `/api/ledger/accounts/${id}` : '/api/ledger/accounts', {
            method: id ? 'PATCH' : 'POST',
            body: id ? { code: input.code, name: input.name } : input,
          })
        ).account,
      ),
    onSuccess: after,
  });
}

export function useDeleteAccount() {
  const after = useAfterLedgerChange();
  return useMutation({
    mutationFn: async (id: string) => {
      await api(`/api/ledger/accounts/${id}`, { method: 'DELETE' });
    },
    onSuccess: after,
  });
}
