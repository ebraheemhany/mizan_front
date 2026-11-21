// lib/audit/hooks.ts
// The audit log (backend /api/audit): who did what, when, from where. Owner only.
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'send'
  | 'cancel'
  | 'payment'
  | 'permissions'
  | 'login'
  | 'settings'
  | 'books';

export const AUDIT_ACTIONS: AuditAction[] = [
  'create',
  'update',
  'delete',
  'send',
  'cancel',
  'payment',
  'permissions',
  'login',
  'settings',
  'books',
];

export type AuditPeriod = 'd7' | 'd30' | 'd90' | 'all';
export const AUDIT_PERIODS: AuditPeriod[] = ['d7', 'd30', 'd90', 'all'];

export type AuditLine = {
  id: string;
  at: string;
  action: AuditAction;
  /** What happened (AuditLog.events.<event>). */
  event: string;
  item: { type: string; id: string | null; ref: string | null };
  values: Record<string, unknown>;
  ip: string | null;
  /** null: the system. A name with no id: a removed user, or a customer answering from a link. */
  user: { id: string | null; name: string | null } | null;
};

export type AuditParams = {
  q: string;
  /** 'all', 'system' (nobody signed in), or a user's id. */
  userId: string;
  action: 'all' | AuditAction;
  period: AuditPeriod;
  page: number;
  pageSize: number;
};

export type AuditPage = {
  items: AuditLine[];
  total: number;
  page: number;
  pageSize: number;
  /** Everyone in the company, for the user filter. */
  users: { id: string; name: string }[];
};

function search(params: Omit<AuditParams, 'page' | 'pageSize'>) {
  const s = new URLSearchParams({ action: params.action, period: params.period });
  if (params.q) s.set('q', params.q.slice(0, 100));
  if (params.userId !== 'all') s.set('userId', params.userId);
  return s;
}

export function useAuditLog(params: AuditParams) {
  const allowed = can(useSession().role, 'auditLog');
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => {
      const s = search(params);
      s.set('page', String(params.page));
      s.set('pageSize', String(params.pageSize));
      return api<AuditPage>(`/api/audit?${s}`);
    },
    enabled: allowed,
    placeholderData: keepPreviousData,
    // Every visit shows what just happened.
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/** Every line with these filters (up to 5000), for the CSV. */
export function fetchAuditExport(params: Omit<AuditParams, 'page' | 'pageSize'>) {
  return api<{ items: AuditLine[]; limited: boolean }>(`/api/audit/export?${search(params)}`);
}
