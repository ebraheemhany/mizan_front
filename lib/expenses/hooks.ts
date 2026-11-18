// lib/expenses/hooks.ts
// Expenses API (backend /api/expenses) as TanStack Query hooks, plus conversion
// to the Expense shape the existing table, notifications and search use.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import type { Expense, ExpenseCategory, ExpenseSource } from '@/lib/mock/expenses';
import { queryKeys } from '@/lib/query/keys';

export type ApiExpense = {
  id: string;
  title: string;
  category: ExpenseCategory;
  /** Money as a 2-decimal string. */
  amount: string;
  date: string;
  status: 'paid' | 'due';
  paidFrom: ExpenseSource | null;
  dueDate: string | null;
  vendor: string | null;
  createdAt: string;
};

export type ExpenseListParams = {
  q?: string;
  category: 'all' | ExpenseCategory;
  period: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear';
  page: number;
  pageSize: number;
};

export type ExpenseStats = {
  /** The current business month, "YYYY-MM". */
  month: string;
  total: number;
  prevTotal: number;
  changePct: number | null;
  byCategory: { key: ExpenseCategory; amount: number; share: number }[];
  due: number;
  dueCount: number;
  dueVendors: number;
  revenue: number;
  netProfit: number;
};

export type NewExpense = {
  title: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
  paidFrom: ExpenseSource;
};

export function toUiExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    date: e.date,
    title: e.title,
    category: e.category,
    // For display only; totals are worked out by the backend.
    amount: Number(e.amount),
    status: e.status,
    paidFrom: e.paidFrom ?? undefined,
    dueDate: e.dueDate ?? undefined,
    vendor: e.vendor ?? undefined,
  };
}

function toQueryString(params: Partial<ExpenseListParams>) {
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

type ListResponse = { items: ApiExpense[]; total: number; all: number; page: number; pageSize: number };

export function useExpenseList(params: ExpenseListParams) {
  return useQuery({
    queryKey: queryKeys.expenses.list(params),
    queryFn: () => api<ListResponse>(`/api/expenses${toQueryString(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseStats() {
  return useQuery({
    queryKey: queryKeys.expenses.stats,
    queryFn: async (): Promise<ExpenseStats> => {
      const { stats } = await api<{
        stats: Omit<ExpenseStats, 'total' | 'prevTotal' | 'due' | 'revenue' | 'netProfit' | 'byCategory'> & {
          total: string;
          prevTotal: string;
          due: string;
          revenue: string;
          netProfit: string;
          byCategory: { category: ExpenseCategory; amount: string; share: number }[];
        };
      }>('/api/expenses/stats');
      return {
        ...stats,
        total: Number(stats.total),
        prevTotal: Number(stats.prevTotal),
        due: Number(stats.due),
        revenue: Number(stats.revenue),
        netProfit: Number(stats.netProfit),
        byCategory: stats.byCategory.map((c) => ({ key: c.category, amount: Number(c.amount), share: c.share })),
      };
    },
  });
}

export async function fetchExpensesForExport(params: Omit<ExpenseListParams, 'page' | 'pageSize'>) {
  const { items } = await api<{ items: ApiExpense[] }>(`/api/expenses/export${toQueryString(params)}`);
  return items.map(toUiExpense);
}

/**
 * Expenses for the top bar (notifications for due ones, command search by title).
 * Only fetched for roles that may see expenses; everyone else gets an empty list.
 */
export function useExpenses() {
  const user = useSession();
  const allowed = can(user.role, 'expenses');
  const recent = useQuery({
    queryKey: queryKeys.expenses.list({ topBar: true }),
    queryFn: () => api<ListResponse>('/api/expenses?pageSize=100'),
    enabled: allowed,
    staleTime: 60_000,
  });
  const due = useQuery({
    queryKey: queryKeys.expenses.due,
    queryFn: async () => (await api<{ items: ApiExpense[] }>('/api/expenses/due')).items,
    enabled: allowed,
    staleTime: 60_000,
  });
  // A disabled query still returns what is cached: never hand it to a role that may not read expenses.
  if (!allowed) return { expenses: [] };
  // Due ones first (they may be older than the 100 most recent), without duplicates.
  const byId = new Map<string, ApiExpense>();
  for (const e of [...(due.data ?? []), ...(recent.data?.items ?? [])]) byId.set(e.id, e);
  return { expenses: [...byId.values()].map(toUiExpense) };
}

// ---------------------------------------------------------------------------
// Mutations: expenses also change the dashboard's expenses and net profit.
// ---------------------------------------------------------------------------

function useAfterExpenseChange() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useAddExpense() {
  const after = useAfterExpenseChange();
  return useMutation({
    mutationFn: async (input: NewExpense) =>
      (await api<{ expense: ApiExpense }>('/api/expenses', { method: 'POST', body: { ...input, status: 'paid' } }))
        .expense,
    onSuccess: after,
  });
}

export function useDeleteExpense() {
  const after = useAfterExpenseChange();
  return useMutation({
    mutationFn: (id: string) => api(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSettled: after,
  });
}
