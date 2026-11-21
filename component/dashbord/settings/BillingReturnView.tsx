// component/dashbord/settings/BillingReturnView.tsx
// Back from the checkout: waits for Paymob's confirmation (it reaches the server
// separately), then says whether the plan is on.
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { CircleCheck, CircleX, Loader2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useBillingPayment } from '@/lib/billing/hooks';
import { queryKeys } from '@/lib/query/keys';

const primary =
  'rounded-btn bg-brand hover:bg-brand/90 inline-flex h-11 items-center justify-center px-6 text-sm font-bold text-white';
const outline =
  'rounded-btn border-line-strong text-ink hover:bg-canvas inline-flex h-11 items-center justify-center border px-6 text-sm font-bold';

/** After this long without an answer, say it may take a while. */
const SLOW_MS = 45_000;

export default function BillingReturnView() {
  const t = useTranslations('BillingReturn');
  const tPlans = useTranslations('Settings.subscription.plans');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const queryClient = useQueryClient();
  const id = useSearchParams().get('payment');
  const payment = useBillingPayment(id);
  const [slow, setSlow] = useState(false);
  const status = payment.data?.status;

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // The plan changed: everything showing it reloads.
  useEffect(() => {
    if (status === 'paid') void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
  }, [status, queryClient]);

  const day = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn', timeZone: 'UTC' });

  let body: React.ReactNode;
  if (!id || payment.isError) {
    body = (
      <>
        <CircleX className="text-danger mx-auto size-12" />
        <h1 className="text-ink text-xl font-extrabold">{t('unknownTitle')}</h1>
        <p className="text-body text-sm leading-7">{payment.isError ? errorMessage(payment.error) : t('unknownBody')}</p>
        <Link href="/settings#subscription" className={primary}>
          {t('toSubscription')}
        </Link>
      </>
    );
  } else if (!payment.data || status === 'pending') {
    body = (
      <>
        <Loader2 className="text-brand mx-auto size-12 animate-spin" />
        <h1 className="text-ink text-xl font-extrabold">{t('waitingTitle')}</h1>
        <p className="text-body text-sm leading-7">{slow ? t('slowBody') : t('waitingBody')}</p>
        {slow && (
          <Link href="/settings#subscription" className={outline}>
            {t('toSubscription')}
          </Link>
        )}
      </>
    );
  } else if (status === 'paid') {
    const p = payment.data;
    body = (
      <>
        <CircleCheck className="text-brand mx-auto size-12" />
        <h1 className="text-ink text-xl font-extrabold">{t('paidTitle', { plan: tPlans(p.plan) })}</h1>
        <p className="text-body text-sm leading-7">
          {p.periodEnd ? t('paidBody', { number: p.number, date: day(p.periodEnd) }) : t('paidBodyShort', { number: p.number })}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className={primary}>
            {t('toDashboard')}
          </Link>
          <Link href="/settings#subscription" className={outline}>
            {t('toSubscription')}
          </Link>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <CircleX className="text-danger mx-auto size-12" />
        <h1 className="text-ink text-xl font-extrabold">{t('failedTitle')}</h1>
        <p className="text-body text-sm leading-7">{t('failedBody')}</p>
        <Link href="/settings#subscription" className={primary}>
          {t('tryAgain')}
        </Link>
      </>
    );
  }

  return (
    <div className="rounded-card border-line bg-surface mx-auto mt-6 max-w-md space-y-4 border p-8 text-center shadow-sm">{body}</div>
  );
}
