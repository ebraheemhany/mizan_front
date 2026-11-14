// lib/api/use-api-error.ts
'use client';

import { useTranslations } from 'next-intl';
import { ApiError } from './client';

/** Turns any thrown error into a message in the user's language (messages: ApiErrors.*). */
export function useApiErrorMessage() {
  const t = useTranslations('ApiErrors');

  return (error: unknown) => {
    if (!(error instanceof ApiError)) return t('INTERNAL_ERROR');
    if (error.code === 'TOO_MANY_REQUESTS') {
      const seconds = error.details?.retryAfterSeconds ?? 60;
      return t('TOO_MANY_REQUESTS', { minutes: Math.max(1, Math.ceil(seconds / 60)) });
    }
    return t.has(error.code) ? t(error.code) : t('INTERNAL_ERROR');
  };
}
