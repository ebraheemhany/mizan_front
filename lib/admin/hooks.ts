// lib/admin/hooks.ts
// The platform admin pages (backend /api/admin, Mizan's own staff only): every company,
// its plan and how much it uses Mizan. Counts and dates only, nothing from inside a company.
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export type PlanId = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'pastDue' | 'ended';

export type AdminOverview = {
  companies: { total: number; newThisMonth: number; newLast7Days: number; active7Days: number; active30Days: number };
  users: number;
  plans: Record<PlanId, number>;
  subscriptions: { paying: number; pastDue: number; cancelling: number };
  /** Mizan's own revenue (EGP). Amounts are decimal strings. */
  revenue: { currency: string; monthlyRecurring: string; thisMonth: string; total: string };
  desktopCompanies30Days: number;
};

export type AdminCompanyRow = {
  id: string;
  name: string;
  createdAt: string;
  currency: string;
  owner: { name: string | null; email: string } | null;
  plan: PlanId;
  subscription: { status: SubscriptionStatus; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
  users: number;
  customers: number;
  invoices: number;
  invoicesThisMonth: number;
  lastActiveAt: string | null;
};

export type AdminSort = 'newest' | 'oldest' | 'active' | 'usage' | 'name';
export type AdminCompaniesParams = { q: string; plan: 'all' | PlanId; sort: AdminSort; page: number };

export type AdminCompanies = {
  companies: AdminCompanyRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<'all' | PlanId, number>;
};

export type AdminCompanyDetail = {
  company: {
    id: string;
    name: string;
    createdAt: string;
    currency: string;
    phone: string | null;
    address: string | null;
    taxNumber: string | null;
    commercialRegister: string | null;
  };
  plan: {
    id: PlanId;
    price: number;
    users: { used: number; limit: number };
    invoicesThisMonth: { used: number; limit: number | null };
  };
  subscription: {
    plan: PlanId;
    status: SubscriptionStatus;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    nextPlan: PlanId | null;
    card: { brand: string | null; masked: string } | null;
    renewalAttempts: number;
  } | null;
  members: {
    id: string;
    fullName: string;
    email: string;
    role: 'owner' | 'accountant' | 'sales' | 'viewer';
    createdAt: string;
    emailVerified: boolean;
    google: boolean;
    password: boolean;
    lastActiveAt: string | null;
    desktop: boolean;
  }[];
  usage: Record<
    'customers' | 'products' | 'invoices' | 'invoicesThisMonth' | 'quotes' | 'payments' | 'expenses' | 'recurring' | 'deals' | 'tasks' | 'employees',
    number
  >;
  activity: { days: { day: string; count: number }[] };
  billing: {
    number: string;
    kind: 'subscribe' | 'upgrade' | 'renewal';
    plan: PlanId;
    amount: string;
    currency: string;
    status: 'pending' | 'paid' | 'failed';
    automatic: boolean;
    createdAt: string;
    paidAt: string | null;
    periodStart: string | null;
    periodEnd: string | null;
  }[];
};

const adminKeys = {
  all: ['admin'] as const,
  overview: ['admin', 'overview'] as const,
  companies: (params: AdminCompaniesParams) => ['admin', 'companies', params] as const,
  company: (id: string) => ['admin', 'company', id] as const,
};

export function useAdminOverview() {
  return useQuery({ queryKey: adminKeys.overview, queryFn: () => api<AdminOverview>('/api/admin/overview') });
}

export function useAdminCompanies(params: AdminCompaniesParams) {
  return useQuery({
    queryKey: adminKeys.companies(params),
    queryFn: () => {
      const search = new URLSearchParams({ plan: params.plan, sort: params.sort, page: String(params.page) });
      if (params.q.trim()) search.set('q', params.q.trim());
      return api<AdminCompanies>(`/api/admin/companies?${search}`);
    },
    // The table stays while the next page or search loads.
    placeholderData: keepPreviousData,
  });
}

export function useAdminCompany(id: string) {
  return useQuery({ queryKey: adminKeys.company(id), queryFn: () => api<AdminCompanyDetail>(`/api/admin/companies/${id}`) });
}
