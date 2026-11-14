// lib/query/provider.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError, onSessionExpired } from '@/lib/api/client';
import { queryKeys } from './keys';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30s: switching pages back and forth doesn't refetch.
        staleTime: 30_000,
        // Retrying a 4xx (not found, forbidden, validation...) can't succeed. Only
        // retry network problems and server errors, at most twice.
        retry: (failureCount, error) =>
          failureCount < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
      },
      mutations: {
        // Never resend a create/update/delete on its own.
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser tab, created once (not on every render).
  const [queryClient] = useState(makeQueryClient);

  // When a request finds the session gone (refresh failed), mark it logged out;
  // SessionProvider then sends the user to /login.
  useEffect(
    () => onSessionExpired(() => queryClient.setQueryData(queryKeys.session, null)),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only included in development builds. */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
