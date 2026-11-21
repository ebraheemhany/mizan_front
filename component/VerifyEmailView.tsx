// component/VerifyEmailView.tsx
// The page the "confirm your email" link opens: confirms right away and says so.
'use client';

import { useTranslations } from 'next-intl';
import { CircleCheck, Loader2, MailX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useVerifyEmail } from '@/lib/auth/account';

const primary =
  'rounded-btn bg-brand hover:bg-brand/90 inline-flex h-11 items-center justify-center px-6 text-sm font-bold text-white';

export default function VerifyEmailView({ token }: { token: string }) {
  const t = useTranslations('Auth.verify');
  const errorMessage = useApiErrorMessage();
  const verify = useVerifyEmail(token);

  if (verify.isPending) {
    return (
      <p role="status" className="text-muted flex items-center justify-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('loading')}
      </p>
    );
  }

  if (verify.isError) {
    const dead = verify.error instanceof ApiError && verify.error.code === 'INVALID_VERIFICATION_TOKEN';
    return (
      <div className="space-y-4 py-4 text-center">
        <span className="bg-danger-soft text-danger mx-auto flex size-14 items-center justify-center rounded-2xl">
          <MailX className="size-7" />
        </span>
        <h1 className="text-ink text-2xl font-extrabold">{dead ? t('invalidTitle') : t('errorTitle')}</h1>
        <p className="text-body text-sm leading-7">{dead ? t('invalidBody') : errorMessage(verify.error)}</p>
        {dead ? (
          <Link href="/dashboard" className={primary}>
            {t('continue')}
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => verify.refetch()}
            className="rounded-btn border-line-strong h-10 border text-sm font-bold"
          >
            {t('retry')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 text-center">
      <span className="bg-brand-soft text-brand-deep mx-auto flex size-14 items-center justify-center rounded-2xl">
        <CircleCheck className="size-7" />
      </span>
      <h1 className="text-ink text-2xl font-extrabold">{t('doneTitle')}</h1>
      <p className="text-body text-sm leading-7">
        {t.rich('doneBody', {
          email: verify.data.email,
          b: (chunks) => (
            <bdi dir="ltr" className="text-ink inline-block max-w-full font-bold break-all">
              {chunks}
            </bdi>
          ),
        })}
      </p>
      <Link href="/dashboard" className={primary}>
        {t('continue')}
      </Link>
    </div>
  );
}
