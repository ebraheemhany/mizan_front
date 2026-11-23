// component/dashbord/settings/SecuritySection.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/session';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import SwitchControl from './SwitchControl';

export function SecuritySection() {
  const t = useTranslations('Settings.security');
  // Made with Google and no password yet: the button sets one.
  const noPassword = useSession().hasPassword === false;
  // TODO: القيم دي تيجي من الـ API
  const [twoFactor, setTwoFactor] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <section
      id="security"
      className="rounded-card border-line bg-surface scroll-mt-24 border p-6 shadow-sm"
    >
      <h2 className="text-ink mb-4 text-base font-extrabold">{t('title')}</h2>

      <div className="divide-line divide-y">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="text-start">
            <p className="text-ink text-sm font-bold">{t('twoFactor.title')}</p>
            <p className="text-muted mt-0.5 text-xs">{t('twoFactor.hint')}</p>
          </div>
          <SwitchControl
            checked={twoFactor}
            ariaLabel={t('twoFactor.title')}
            onChange={(v) => {
              setTwoFactor(v);
              toast.success(t(v ? 'twoFactor.on' : 'twoFactor.off'));
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-4">
          <div className="text-start">
            <p className="text-ink text-sm font-bold">
              {t('autoLogout.title')}
            </p>
            <p className="text-muted mt-0.5 text-xs">{t('autoLogout.hint')}</p>
          </div>
          <SwitchControl
            checked={autoLogout}
            ariaLabel={t('autoLogout.title')}
            onChange={(v) => {
              setAutoLogout(v);
              toast.success(t(v ? 'autoLogout.on' : 'autoLogout.off'));
            }}
          />
        </div>

        <div className="bg-brand-soft/50 border-brand/15 mt-2 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-start">
            <span className="bg-surface text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-ink text-sm font-bold">
                {t('password.label')}
              </p>
              <p className="text-muted mt-0.5 text-xs">
                {t(noPassword ? 'password.googleHint' : 'password.hint')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPwOpen(true)}
            className="border-brand/25 bg-surface text-brand hover:bg-brand-soft h-10 shrink-0 text-xs font-bold"
          >
            {t(noPassword ? 'password.set' : 'password.change')}
          </Button>
        </div>
      </div>

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </section>
  );
}
