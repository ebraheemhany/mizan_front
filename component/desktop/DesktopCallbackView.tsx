// component/desktop/DesktopCallbackView.tsx
// Where the desktop app lands when the browser hands it a sign-in code
// (mizan://auth?code=...&state=...; lib/desktop-sign-in.ts, step 3): checks the state
// is the one this app started with, trades the code for a session, and opens the app.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { redeemDesktopCode } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { clearPendingSignIn, findPendingSignIn, useSearch } from '@/lib/desktop-sign-in';

export default function DesktopCallbackView() {
  const t = useTranslations('Desktop.callback');
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const [failure, setFailure] = useState<string | null>(null);
  // The code works once: never send it twice (React runs effects twice in development).
  const started = useRef(false);

  // undefined until read in the browser; null when it isn't a sign-in this app started.
  const search = useSearch();
  const signIn = useMemo(() => {
    if (search === null) return undefined;
    const query = new URLSearchParams(search);
    const code = query.get('code');
    const pending = findPendingSignIn(query.get('state') ?? '');
    return code && pending ? { code, next: pending.next } : null;
  }, [search]);

  useEffect(() => {
    if (!signIn || started.current) return;
    started.current = true;
    redeemDesktopCode(signIn.code)
      .then(() => {
        clearPendingSignIn();
        // A full load, so the app starts fresh with the new session.
        window.location.replace(`/${locale}${signIn.next ?? '/dashboard'}`);
      })
      .catch((err: unknown) => setFailure(errorMessage(err)));
  }, [signIn, locale, errorMessage]);

  const error = signIn === null ? t('invalid') : failure;
  if (!error) {
    return (
      <p role="status" className="text-muted flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('signingIn')}
      </p>
    );
  }

  return (
    <div>
      <p role="alert" className="bg-danger-soft text-danger rounded-btn px-3 py-2.5 text-sm font-semibold">
        {error}
      </p>
      <Link
        href="/login"
        className="rounded-btn bg-brand hover:bg-brand/90 mt-5 flex h-12 w-full items-center justify-center font-bold text-white shadow-sm"
      >
        {t('backToLogin')}
      </Link>
    </div>
  );
}
