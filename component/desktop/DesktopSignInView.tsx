// component/desktop/DesktopSignInView.tsx
// Opened by the desktop app in the computer's browser (lib/desktop-sign-in.ts, step 2):
// sign in with Google here, then the page hands the app a one-time code through a
// mizan:// link. Someone already signed in in this browser just confirms who they are.
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, MonitorCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import GoogleSignIn from '@/component/GoogleSignIn';
import { api, logout, refreshSession, type SessionUser } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { desktopAppLink, isDesktopState, useSearch } from '@/lib/desktop-sign-in';

type Stage =
  | { name: 'loading' }
  | { name: 'signIn' }
  | { name: 'signedIn'; user: SessionUser }
  | { name: 'handing' }
  | { name: 'done'; link: string }
  | { name: 'error'; message: string };

export default function DesktopSignInView() {
  const t = useTranslations('Desktop.signIn');
  const errorMessage = useApiErrorMessage();
  const [stage, setStage] = useState<Stage>({ name: 'loading' });
  const started = useRef(false);

  // undefined until read in the browser; null when the page wasn't opened by the app.
  const search = useSearch();
  const params = useMemo(() => {
    if (search === null) return undefined;
    const query = new URLSearchParams(search);
    const state = query.get('state');
    return state && isDesktopState(state) ? { state, invitation: query.get('invitation') ?? undefined } : null;
  }, [search]);

  useEffect(() => {
    if (!params || started.current) return;
    started.current = true;
    // An invitation is for whoever it was sent to: always choose the account for it.
    const session = params.invitation ? Promise.resolve(null) : refreshSession().catch(() => null);
    void session.then((found) => setStage(found ? { name: 'signedIn', user: found.user } : { name: 'signIn' }));
  }, [params]);

  const handOver = useCallback(async () => {
    if (!params) return;
    setStage({ name: 'handing' });
    try {
      const { code } = await api<{ code: string }>('/api/auth/desktop-code', { method: 'POST' });
      const link = desktopAppLink(code, params.state);
      setStage({ name: 'done', link });
      window.location.href = link;
    } catch (error) {
      setStage({ name: 'error', message: errorMessage(error) });
    }
  }, [params, errorMessage]);

  async function switchAccount() {
    await logout();
    setStage({ name: 'signIn' });
  }

  return (
    <div>
      <div className="bg-brand-soft text-brand mb-5 flex size-12 items-center justify-center rounded-2xl">
        <MonitorCheck className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-ink text-2xl leading-tight font-extrabold">{t('title')}</h1>

      {params === null && <p className="text-body mt-3 text-sm leading-7">{t('invalid')}</p>}

      {params !== null && stage.name === 'loading' && (
        <p role="status" className="text-muted mt-6 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('loading')}
        </p>
      )}

      {stage.name === 'signIn' && (
        <>
          <p className="text-body mt-3 text-sm leading-7">{params?.invitation ? t('invitationSubtitle') : t('subtitle')}</p>
          <GoogleSignIn invitationToken={params?.invitation} onSignedIn={handOver} onInvitationDead={() => setStage({ name: 'error', message: t('invitationDead') })} />
          <p className="text-muted mt-5 text-xs leading-5">{t('passwordHint')}</p>
        </>
      )}

      {stage.name === 'signedIn' && (
        <>
          <p className="text-body mt-3 text-sm leading-7">
            {t.rich('signedInAs', {
              name: stage.user.fullName,
              email: stage.user.email,
              b: (chunks) => <b className="text-ink font-bold">{chunks}</b>,
              e: (chunks) => (
                <span dir="ltr" className="text-muted">
                  {chunks}
                </span>
              ),
            })}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={handOver} className="rounded-btn bg-brand hover:bg-brand/90 h-12 w-full font-bold text-white shadow-sm">
              {t('continue')}
            </Button>
            <Button type="button" variant="ghost" onClick={switchAccount} className="text-muted h-10 text-sm font-bold">
              {t('otherAccount')}
            </Button>
          </div>
        </>
      )}

      {stage.name === 'handing' && (
        <p role="status" className="text-muted mt-6 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('opening')}
        </p>
      )}

      {stage.name === 'done' && (
        <>
          <p className="text-ink mt-3 text-base font-bold">{t('doneTitle')}</p>
          <p className="text-body mt-1 text-sm leading-7">{t('doneText')}</p>
          <a
            href={stage.link}
            className="rounded-btn bg-brand hover:bg-brand/90 mt-6 flex h-12 w-full items-center justify-center font-bold text-white shadow-sm"
          >
            {t('openApp')}
          </a>
        </>
      )}

      {stage.name === 'error' && (
        <>
          <p role="alert" className="bg-danger-soft text-danger rounded-btn mt-4 px-3 py-2.5 text-sm font-semibold">
            {stage.message}
          </p>
          <Button type="button" variant="ghost" onClick={() => setStage({ name: 'signIn' })} className="text-brand mt-3 h-10 text-sm font-bold">
            {t('retry')}
          </Button>
        </>
      )}
    </div>
  );
}
