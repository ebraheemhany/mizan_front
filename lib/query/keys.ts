// lib/query/keys.ts
// Every query key in the app lives here, so invalidating ("refetch everything
// about customers") is one import away and keys never drift between files.
//
// Convention for the modules to come:
//   customers: {
//     all: ['customers'] as const,
//     list: (filters) => ['customers', 'list', filters] as const,
//     detail: (id) => ['customers', 'detail', id] as const,
//   }

export const queryKeys = {
  session: ['session'] as const,
  team: {
    all: ['team'] as const,
    members: ['team', 'members'] as const,
    invitations: ['team', 'invitations'] as const,
  },
  /** Names of everyone in the company (any role), for "assigned to" pickers. */
  teamDirectory: ['team-directory'] as const,
  customers: {
    all: ['customers'] as const,
    list: (params: object) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (params: object) => ['invoices', 'list', params] as const,
    stats: ['invoices', 'stats'] as const,
    detail: (ref: string | number) => ['invoices', 'detail', String(ref)] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (params: object) => ["payments", "list", params] as const,
    stats: ["payments", "stats"] as const,
    openInvoices: ["payments", "open-invoices"] as const,
  },
  dashboard: ["dashboard"] as const,
  expenses: {
    all: ['expenses'] as const,
    list: (params: object) => ['expenses', 'list', params] as const,
    stats: ['expenses', 'stats'] as const,
    due: ['expenses', 'due'] as const,
  },
  /** Financial reports; `period` null = the current month (the server's default). */
  reports: {
    all: ['reports'] as const,
    summary: (period: string | null) => ['reports', 'summary', period] as const,
    aging: ['reports', 'aging'] as const,
    vat: (period: string | null) => ['reports', 'vat', period] as const,
    statement: (customerId: string, period: string | null) => ['reports', 'statement', customerId, period] as const,
  },
  /**
   * Tasks: one list for the whole company (open ones + the last 60 days' completed ones),
   * shared by the tasks page, the notifications bell, the search and the sidebar badge.
   */
  tasks: {
    all: ['tasks'] as const,
    list: ['tasks', 'list'] as const,
  },
  /** Recurring invoice templates. */
  recurring: {
    all: ['recurring'] as const,
    list: (params: object) => ['recurring', 'list', params] as const,
    detail: (id: string) => ['recurring', 'detail', id] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    list: (params: object) => ['quotes', 'list', params] as const,
    stats: ['quotes', 'stats'] as const,
    /** By number (/quotes/212) or id; both are cached after a change. */
    detail: (ref: string | number) => ['quotes', 'detail', String(ref)] as const,
  },
  /** Public: an invoice opened from its shareable link (no login). */
  publicInvoice: (token: string) => ['public-invoice', token] as const,
  /** Public: a quote opened from its shareable link (no login). */
  publicQuote: (token: string) => ['public-quote', token] as const,
  /** Company settings (currency, numbering, details...). */
  settings: ['settings'] as const,
  products: {
    all: ['products'] as const,
    list: (params: object) => ['products', 'list', params] as const,
    nextCode: (type: string) => ['products', 'next-code', type] as const,
  },
  /** Public: what an invite link points to (no login). */
  invitationPreview: (token: string) => ['invitation-preview', token] as const,
};
