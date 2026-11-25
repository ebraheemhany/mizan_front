// lib/billing/hooks.ts
// The company's plan and subscription (backend /api/billing), paid through Paymob.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useMailLocale } from '@/lib/auth/account';
import { queryKeys } from '@/lib/query/keys';

export type PlanId = 'free' | 'pro' | 'business';

export type Plan = {
  id: PlanId;
  /** Per month, EGP. */
  price: number;
  users: number;
  /** null = no limit. */
  invoicesPerMonth: number | null;
  recurring: boolean;
};

export type Subscription = {
  status: 'active' | 'pastDue';
  periodStart: string;
  /** The renewal is due on this day. */
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextPlan: PlanId | null;
  card: { masked: string; brand: string | null } | null;
  /** pastDue: the plan stops on this day unless the renewal is paid. */
  graceEndsOn: string | null;
};

export type Billing = {
  plan: PlanId;
  subscription: Subscription | null;
  usage: { users: number; usersLimit: number; invoicesThisMonth: number; invoicesLimit: number | null };
  plans: Plan[];
  /** No Paymob keys yet: payments go through a local test page. */
  testMode: boolean;
};

export type BillingPayment = {
  id: string;
  number: string;
  kind: 'subscribe' | 'upgrade' | 'renewal';
  plan: PlanId;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  automatic: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  failureReason: string | null;
  createdAt: string;
  paidAt: string | null;
};

/** What each plan's card lists (Settings.subscription.upgradeDialog.features.*). */
export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: ['users', 'invoices10', 'basicReports'],
  pro: ['users', 'invoicesUnlimited', 'fullReports', 'recurring', 'payroll'],
  business: ['users', 'allPro', 'advancedPermissions', 'prioritySupport'],
};

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business'];
export const isHigherPlan = (a: PlanId, b: PlanId) => PLAN_ORDER.indexOf(a) > PLAN_ORDER.indexOf(b);

export function useBilling() {
  return useQuery({
    queryKey: queryKeys.billing.summary,
    queryFn: async () => (await api<{ billing: Billing }>('/api/billing')).billing,
    staleTime: 60_000,
  });
}

/** The payments (owner only). */
export function useBillingPayments(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.billing.payments,
    queryFn: async () => (await api<{ items: BillingPayment[] }>('/api/billing/payments')).items,
    enabled,
  });
}

/** One payment, asked again every 2 seconds while Paymob hasn't answered. */
export function useBillingPayment(id: string | null) {
  return useQuery({
    queryKey: queryKeys.billing.payment(id ?? ''),
    queryFn: async () => (await api<{ payment: BillingPayment }>(`/api/billing/payments/${id}`)).payment,
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  });
}

/** Opens Paymob's page (or the test page) for a plan: the browser leaves the app. */
export function useCheckout() {
  const locale = useMailLocale();
  return useMutation({
    mutationFn: async (plan: Exclude<PlanId, 'free'>) => {
      const result = await api<{ url: string; paymentId: string }>('/api/billing/checkout', {
        method: 'POST',
        body: { plan, locale },
      });
      window.location.assign(result.url);
      return result;
    },
  });
}

/** Downgrade (a lower paid plan from the next period), cancel (free at the period's end), resume. */
export function useSubscriptionChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: { kind: 'downgrade'; plan: 'pro' } | { kind: 'cancel' } | { kind: 'resume' }) =>
      (
        await api<{ billing: Billing }>(`/api/billing/${change.kind}`, {
          method: 'POST',
          body: change.kind === 'downgrade' ? { plan: change.plan } : undefined,
        })
      ).billing,
    onSuccess: (billing) => queryClient.setQueryData(queryKeys.billing.summary, billing),
  });
}
