// lib/auth/account.ts
// Links emailed to a user: forgotten password and confirming the address.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { api, type SessionUser } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

/** The language the backend writes emails in: the page's. */
export type MailLocale = 'ar' | 'en';
export function useMailLocale(): MailLocale {
  return useLocale() === 'en' ? 'en' : 'ar';
}

/** Always "done" (the server never says whether the address has an account). */
export function useForgotPasswordMutation() {
  const locale = useMailLocale();
  return useMutation({
    mutationFn: (email: string) =>
      api('/api/auth/forgot-password', { method: 'POST', auth: false, body: { email, locale } }),
  });
}

/** Whether a reset link still works, and for which address. */
export function useResetPasswordPreview(token: string) {
  return useQuery({
    queryKey: ['reset-password', token],
    queryFn: () => api<{ email: string }>(`/api/auth/reset-password/${encodeURIComponent(token)}`, { auth: false }),
    retry: false,
    staleTime: Infinity,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      api('/api/auth/reset-password', { method: 'POST', auth: false, body: input }),
  });
}

/**
 * Confirms the address as soon as the page opens. Opening the link again is
 * fine (the server says yes again), so React running it twice does no harm.
 */
export function useVerifyEmail(token: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      const result = await api<{ email: string }>('/api/auth/verify-email', {
        method: 'POST',
        auth: false,
        body: { token },
      });
      // Signed in on this browser as that user: the banner goes away.
      queryClient.setQueryData<SessionUser | null>(queryKeys.session, (user) =>
        user && user.email === result.email ? { ...user, emailVerifiedAt: new Date().toISOString() } : user,
      );
      return result;
    },
    retry: false,
    staleTime: Infinity,
  });
}

export function useResendVerificationMutation() {
  const locale = useMailLocale();
  return useMutation({
    mutationFn: () => api('/api/auth/verify-email/resend', { method: 'POST', body: { locale } }),
  });
}
