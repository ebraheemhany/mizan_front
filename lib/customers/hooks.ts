// lib/customers/hooks.ts
// Customers API (backend /api/customers) as TanStack Query hooks, plus the
// conversion between the API shape and the shape the customers UI uses.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Role } from '@/lib/api/client';
import type { Customer, CustomerStatus, Owner } from '@/lib/mock/customers';
import { queryKeys } from '@/lib/query/keys';
import type { CustomerFormValues } from '@/lib/validations/customer';

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

export type ApiCustomer = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  taxNumber: string | null;
  notes: string | null;
  /** Money as a 2-decimal string, e.g. "8200.00". */
  balance: string;
  lastActivityAt: string;
  createdAt: string;
  status: CustomerStatus;
  assignedTo: { id: string; fullName: string } | null;
};

export type CustomerListParams = {
  q?: string;
  status: 'all' | CustomerStatus;
  /** A team member id, or 'none'. Omitted = everyone. */
  assignedTo?: string;
  balance: 'all' | 'due' | 'zero';
  sort: 'recent' | 'oldest' | 'balance' | 'name';
  page: number;
  pageSize: number;
};

type CustomerListResponse = {
  items: ApiCustomer[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<'all' | CustomerStatus, number>;
};

/** What the backend accepts when creating or editing (empty text clears a field). */
export type CustomerInput = {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  taxNumber: string;
  notes: string;
  assignedToId: string | null;
};

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** API customer -> the shape the existing customers table, sheet and cards use. */
export function toUiCustomer(c: ApiCustomer): Customer {
  return {
    id: c.id,
    name: c.name,
    contact: c.contactName ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    city: c.city ?? '',
    ownerId: c.assignedTo?.id ?? '',
    // For display only; every calculation with money happens on the backend.
    balance: Number(c.balance),
    lastActivityDaysAgo: Math.max(0, Math.floor((Date.now() - new Date(c.lastActivityAt).getTime()) / DAY_MS)),
    status: c.status,
    taxNumber: c.taxNumber ?? undefined,
    notes: c.notes ?? undefined,
  };
}

/** The add/edit form -> the API body. */
export function formToInput(values: CustomerFormValues): CustomerInput {
  return {
    name: values.name,
    contactName: values.contact,
    phone: values.phone,
    email: values.email,
    city: values.city,
    taxNumber: values.taxNumber,
    notes: values.notes,
    assignedToId: values.ownerId || null,
  };
}

function toQueryString(params: Partial<CustomerListParams>) {
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

/** Team members as { id, name } options (any role can read this). */
export function useTeamDirectory() {
  return useQuery({
    queryKey: queryKeys.teamDirectory,
    queryFn: async (): Promise<(Owner & { role: Role })[]> => {
      const { members } = await api<{ members: { id: string; fullName: string; role: Role }[] }>('/api/team-members');
      return members.map((m) => ({ id: m.id, name: m.fullName, role: m.role }));
    },
    staleTime: 5 * 60_000,
  });
}

export function useCustomers(params: CustomerListParams, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => api<CustomerListResponse>(`/api/customers${toQueryString(params)}`),
    // Keep showing the current page while the next one loads (no flashing table).
    placeholderData: keepPreviousData,
    enabled: opts?.enabled ?? true,
  });
}

/** One customer, with totals of its invoices (drafts and cancelled ones not counted). */
export type ApiCustomerDetail = ApiCustomer & {
  invoiceSummary: { billableCount: number; totalInvoiced: string; collected: string };
};

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: async () => (await api<{ customer: ApiCustomerDetail }>(`/api/customers/${id}`)).customer,
  });
}

/** Every customer matching the filters (not just one page), for CSV export. */
export async function fetchCustomersForExport(params: Omit<CustomerListParams, 'page' | 'pageSize'>) {
  const { items } = await api<{ items: ApiCustomer[] }>(`/api/customers/export${toQueryString(params)}`);
  return items;
}

// ---------------------------------------------------------------------------
// Mutations: each one refreshes every customers query (lists, counts, detail).
// ---------------------------------------------------------------------------

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => {
    // Reports show customer names (top customers, aging, statements).
    void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    return queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
  };
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      api<{ customer: ApiCustomer }>('/api/customers', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CustomerInput> }) =>
      api<{ customer: ApiCustomer }>(`/api/customers/${id}`, { method: 'PATCH', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomers() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) {
        await api(`/api/customers/${ids[0]}`, { method: 'DELETE' });
        return { deleted: 1 };
      }
      return api<{ deleted: number }>('/api/customers/bulk-delete', { method: 'POST', body: { ids } });
    },
    onSettled: invalidate,
  });
}

export function useAssignCustomers() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (input: { ids: string[]; assignedToId: string | null }) =>
      api<{ updated: number }>('/api/customers/bulk-assign', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useImportCustomers() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (customers: CustomerInput[]) =>
      api<{ created: number }>('/api/customers/import', { method: 'POST', body: { customers } }),
    onSuccess: invalidate,
  });
}
