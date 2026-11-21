// lib/auth/permissions.ts
// What each role can do. The single source for the frontend: the settings
// permission table shows it, and can() hides actions a user isn't allowed.
// The backend must enforce the same rules; hiding a button is only for UX.
import type { Role } from '@/lib/api/client';

export type { Role };

export const ROLES: Role[] = ['owner', 'accountant', 'sales', 'viewer'];

/** Roles you can invite someone as. A company has one owner: whoever registered it. */
export const INVITE_ROLES = ['accountant', 'sales', 'viewer'] as const satisfies readonly Role[];
export type InvitableRole = (typeof INVITE_ROLES)[number];

export const PERMISSIONS = [
  { key: 'viewCustomers', roles: ['owner', 'accountant', 'sales', 'viewer'] },
  { key: 'editCustomers', roles: ['owner', 'sales'] },
  { key: 'editProducts', roles: ['owner', 'accountant'] },
  { key: 'issueInvoices', roles: ['owner', 'accountant'] },
  { key: 'recordPayments', roles: ['owner', 'accountant'] },
  { key: 'expenses', roles: ['owner', 'accountant'] },
  { key: 'reports', roles: ['owner', 'accountant'] },
  /** The books: chart of accounts, journal, trial balance, manual entries, closing months. */
  { key: 'ledger', roles: ['owner', 'accountant'] },
  /** Opening a closed month again. */
  { key: 'reopenPeriods', roles: ['owner'] },
  /** The audit log: everyone's actions, sign-ins and IPs. */
  { key: 'auditLog', roles: ['owner'] },
  /** Add, edit, complete and delete tasks (everyone can see them). */
  { key: 'tasks', roles: ['owner', 'accountant', 'sales'] },
  /**
   * Create, edit, send, accept/reject, duplicate and delete draft quotes (everyone can
   * see them). Converting one needs 'issueInvoices'; deleting a sent one, 'deleteData'.
   */
  { key: 'quotes', roles: ['owner', 'accountant', 'sales'] },
  /** Work on the sales pipeline (everyone can see it); deleting a won deal needs deleteData. */
  { key: 'deals', roles: ['owner', 'accountant', 'sales'] },
  { key: 'settings', roles: ['owner'] },
  { key: 'deleteData', roles: ['owner'] },
] as const satisfies readonly { key: string; roles: readonly Role[] }[];

export type Permission = (typeof PERMISSIONS)[number]['key'];

export function can(role: Role, permission: Permission) {
  const rule = PERMISSIONS.find((p) => p.key === permission);
  return (rule?.roles as readonly Role[] | undefined)?.includes(role) ?? false;
}
