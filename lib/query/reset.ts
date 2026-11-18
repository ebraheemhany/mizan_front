// lib/query/reset.ts
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

/**
 * Drops every cached query except the session, so whoever uses this browser next
 * never sees the previous user's data.
 *
 * The session entry itself is kept and only ever updated with setQueryData: removing
 * it would leave SessionProvider observing a dead query that never reports the logout
 * (no redirect, and the next useSession() read finds null and throws).
 */
export function dropUserData(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.session[0] });
}
