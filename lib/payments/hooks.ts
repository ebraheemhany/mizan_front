// lib/payments/hooks.ts
// Payments API (backend /api/payments) and the dashboard summary, as TanStack
// Query hooks, plus conversion to the shapes the existing components use.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { OpenInvoice, Payment, PaymentMethod } from '@/lib/mock/payments';
import type { ReceivingAccount } from '@/lib/payments/constants';
import { queryKeys } from '@/lib/query/keys';

// The payments page names a few methods differently from the backend.
// Receiving accounts use the backend's values as they are.
type ApiMethod = 'cash' | 'bank' | 'card' | 'instapay' | 'vodafoneCash' | 'cheque';
type ApiAccount = ReceivingAccount;

const METHOD_TO_API: Record<PaymentMethod, ApiMethod> = {
  bankTransfer: 'bank',
  cash: 'cash',
  instapay: 'instapay',
  vodafoneCash: 'vodafoneCash',
  cheque: 'cheque',
};

const methodFromApi = (m: ApiMethod): PaymentMethod =>
  // A card payment (recorded on an invoice page) has no own label here; it is shown as a bank payment.
  m === 'bank' || m === 'card' ? 'bankTransfer' : m;

export type ApiPayment = {
  id: string;
  number: string;
  invoiceId: string;
  invoiceNumber: number;
  invoiceDisplayNumber: string;
  customerId: string;
  customer: string;
  date: string;
  invoiceDate: string;
  method: ApiMethod;
  amount: string;
  status: 'cleared' | 'pending';
  account: ApiAccount | null;
  reference: string | null;
  note: string | null;
};

export type ApiOpenInvoice = {
  id: string;
  number: number;
  displayNumber: string;
  customerId: string;
  customer: string;
  customerPhone: string | null;
  balance: string;
  issueDate: string;
  dueDate: string;
  daysOverdue: number | null;
};

/** An open invoice as the payments page uses it, plus what the reminders and the bell need. */
export type OpenInvoiceRow = OpenInvoice & {
  id: string;
  customerId: string;
  phone: string | null;
  daysOverdue: number | null;
};

export type PaymentStats = {
  collectedThisMonth: number;
  collectedChangePct: number | null;
  awaiting: number;
  awaitingCount: number;
  pendingCheques: number;
  pendingChequesCount: number;
  avgDaysToCollect: number | null;
  avgDaysToCollectLastMonth: number | null;
};

export type PaymentListParams = {
  q?: string;
  method: 'all' | PaymentMethod;
  period: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear';
  page: number;
  pageSize: number;
};

export function toUiPayment(p: ApiPayment): Payment {
  return {
    id: p.id,
    number: p.number,
    invoiceNo: p.invoiceNumber,
    customer: p.customer,
    date: p.date,
    invoiceDate: p.invoiceDate,
    method: methodFromApi(p.method),
    amount: Number(p.amount),
    status: p.status,
    account: p.account ?? undefined,
    reference: p.reference ?? undefined,
    note: p.note ?? undefined,
  };
}

const toOpenInvoice = (i: ApiOpenInvoice): OpenInvoiceRow => ({
  id: i.id,
  number: i.number,
  customerId: i.customerId,
  customer: i.customer,
  balance: Number(i.balance),
  issued: i.issueDate,
  due: i.dueDate,
  phone: i.customerPhone,
  daysOverdue: i.daysOverdue,
});

function toQueryString(params: Partial<PaymentListParams>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === 'all') continue;
    search.set(key, key === 'method' ? METHOD_TO_API[value as PaymentMethod] : String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () =>
      api<{ items: ApiPayment[]; total: number; all: number; page: number; pageSize: number }>(
        `/api/payments${toQueryString(params)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: queryKeys.payments.stats,
    queryFn: async () => {
      const { stats } = await api<{ stats: Record<keyof PaymentStats, string | number | null> }>('/api/payments/stats');
      return {
        collectedThisMonth: Number(stats.collectedThisMonth),
        collectedChangePct: stats.collectedChangePct as number | null,
        awaiting: Number(stats.awaiting),
        awaitingCount: Number(stats.awaitingCount),
        pendingCheques: Number(stats.pendingCheques),
        pendingChequesCount: Number(stats.pendingChequesCount),
        avgDaysToCollect: stats.avgDaysToCollect as number | null,
        avgDaysToCollectLastMonth: stats.avgDaysToCollectLastMonth as number | null,
      } satisfies PaymentStats;
    },
  });
}

export function useOpenInvoices() {
  return useQuery({
    queryKey: queryKeys.payments.openInvoices,
    queryFn: async () => (await api<{ invoices: ApiOpenInvoice[] }>('/api/payments/open-invoices')).invoices.map(toOpenInvoice),
    // The notifications bell reads this on every page; payments and invoice changes invalidate it.
    staleTime: 60_000,
  });
}

export async function fetchPaymentsForExport(params: Omit<PaymentListParams, 'page' | 'pageSize'>) {
  const { items } = await api<{ items: ApiPayment[] }>(`/api/payments/export${toQueryString(params)}`);
  return items.map(toUiPayment);
}

// ---------------------------------------------------------------------------
// Mutations: a payment changes invoices, customers' balances and the dashboard too.
// ---------------------------------------------------------------------------

function useAfterPaymentChange() {
  const queryClient = useQueryClient();
  return () => {
    // Reports too: collected cash, aging and customer statements.
    for (const key of [
      queryKeys.payments.all,
      queryKeys.invoices.all,
      queryKeys.customers.all,
      queryKeys.dashboard,
      queryKeys.reports.all,
    ]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export type NewPayment = {
  invoiceId: string;
  amount: string;
  date: string;
  method: PaymentMethod;
  account: ReceivingAccount;
  reference: string;
  note: string;
};

export function useRecordPayment() {
  const after = useAfterPaymentChange();
  return useMutation({
    mutationFn: async (input: NewPayment) =>
      (
        await api<{ payment: ApiPayment }>('/api/payments', {
          method: 'POST',
          body: { ...input, method: METHOD_TO_API[input.method] },
        })
      ).payment,
    onSuccess: after,
  });
}

export function useClearPayment() {
  const after = useAfterPaymentChange();
  return useMutation({
    mutationFn: (id: string) => api(`/api/payments/${id}/clear`, { method: 'POST' }),
    onSuccess: after,
  });
}

export function useRemovePayment() {
  const after = useAfterPaymentChange();
  return useMutation({
    mutationFn: (id: string) => api(`/api/payments/${id}`, { method: 'DELETE' }),
    onSettled: after,
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardData = {
  /** null for roles that may not see financial reports. */
  financials: {
    revenue: string;
    revenueChange: number | null;
    expenses: string;
    expensesChange: number | null;
    netProfit: string;
    netProfitChange: number | null;
    chart: { month: string; revenue: string; expenses: string }[];
  } | null;
  receivable: { outstanding: string; overdue: string };
  attention: {
    type: 'invoiceOverdue';
    id: string;
    number: number;
    displayNumber: string;
    customer: string;
    amount: string;
    days: number;
  }[];
  invoicesThisMonth: number;
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api<DashboardData>('/api/dashboard') });
}
