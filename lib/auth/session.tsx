// lib/auth/session.tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { api, login, logout, refreshSession, type SessionUser } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// The current user, as a query
// ---------------------------------------------------------------------------

/**
 * The logged-in user, or null when nobody is logged in.
 * On a page load this runs one refresh (cookie -> new access token + user);
 * after logging in, the login mutation fills it, so no request is needed.
 */
function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async (): Promise<SessionUser | null> => (await refreshSession())?.user ?? null,
    // The user only changes when we log in/out, and then we update it ourselves.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // "Not logged in" is null, not an error, so only connection problems are
    // retried (the QueryProvider default: at most twice).
  });
}

/** The current user. Only use inside <SessionProvider>, where it is always loaded. */
export function useSession() {
  const { data } = useSessionQuery();
  if (!data) throw new Error('useSession must be used inside <SessionProvider>');
  return data;
}

/** Wraps the logged-in part of the app. Sends anyone without a session to /login. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError, refetch, isFetching } = useSessionQuery();
  const loggedOut = !isPending && !isError && !user;

  useEffect(() => {
    if (loggedOut) router.replace('/login');
  }, [loggedOut, router]);

  // Server unreachable: say so, instead of pretending the user is logged out
  // (proxy.ts would send them straight back here, in a loop).
  if (isError) return <SessionUnreachable onRetry={() => refetch()} retrying={isFetching} />;

  // Nothing of the app is shown until we know who is logged in.
  return user ? children : <SessionLoading />;
}

function SessionUnreachable({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const t = useTranslations('Session');
  return (
    <div role="alert" className="bg-canvas flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-ink text-sm font-semibold">{t('unreachable')}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="rounded-btn bg-brand hover:bg-brand/90 flex h-10 items-center gap-2 px-5 text-sm font-bold text-white disabled:opacity-60"
      >
        {retrying && <Loader2 className="size-4 animate-spin" />}
        {t('retry')}
      </button>
    </div>
  );
}

function SessionLoading() {
  const t = useTranslations('Session');
  return (
    <div role="status" className="bg-canvas text-muted flex min-h-dvh items-center justify-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" />
      {t('loading')}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    // Fill the session straight away so the dashboard opens without another request.
    onSuccess: (user) => queryClient.setQueryData(queryKeys.session, user),
  });
}

export type RegisterInput = {
  fullName: string;
  companyName: string;
  email: string;
  password: string;
};

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<{ user: SessionUser }>('/api/auth/register', { method: 'POST', auth: false, body: input }),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Drop every cached query: the next person on this browser must not see
      // the previous user's data. Then mark the session as logged out.
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
      router.replace('/login');
    },
  });
}
