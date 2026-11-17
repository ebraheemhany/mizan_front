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
  products: {
    all: ['products'] as const,
    list: (params: object) => ['products', 'list', params] as const,
    nextCode: (type: string) => ['products', 'next-code', type] as const,
  },
  /** Public: what an invite link points to (no login). */
  invitationPreview: (token: string) => ['invitation-preview', token] as const,
};
