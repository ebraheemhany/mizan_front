// component/dashbord/VerifyEmailBanner.tsx
// Until the user confirms their address: a strip above every page, with "send the link again".
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, MailWarning } from 'lucide-react';
import { toast } from 'sonner';

import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useResendVerificationMutation } from '@/lib/auth/account';
import { useSession } from '@/lib/auth/session';

export default function VerifyEmailBanner() {
  const t = useTranslations('VerifyBanner');
  const user = useSession();
  const errorMessage = useApiErrorMessage();
  const resend = useResendVerificationMutation();
  // Once sent, the button rests (one more email is enough).
  const [sent, setSent] = useState(false);

  if (user.emailVerifiedAt) return null;

  function send() {
    resend.mutate(undefined, {
      onSuccess: () => {
        setSent(true);
        toast.success(t('sent', { email: user.email }));
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 sm:px-6 lg:px-8"
    >
      <MailWarning className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-6">
        {t.rich('text', {
          email: user.email,
          b: (chunks) => (
            <bdi dir="ltr" className="font-bold">
              {chunks}
            </bdi>
          ),
        })}
      </p>
      <button
        type="button"
        onClick={send}
        disabled={resend.isPending || sent}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
      >
        {resend.isPending && <Loader2 className="size-3.5 animate-spin" />}
        {sent ? t('resent') : t('resend')}
      </button>
    </div>
  );
}
