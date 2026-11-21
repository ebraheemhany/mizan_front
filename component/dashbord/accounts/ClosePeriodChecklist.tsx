// component/dashbord/accounts/ClosePeriodChecklist.tsx
// What has to be true before last month can be closed.
'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { usePostDrafts, useTrialBalance, type Periods } from '@/lib/ledger/hooks';
import { cn } from '@/lib/utils';
import { card, outlineBtn, useMonthLabel, useNum } from './ledger-ui';

export default function ClosePeriodChecklist({
  periods,
  onRequestClose,
}: {
  periods: Periods;
  onRequestClose: () => void;
}) {
  const t = useTranslations('Accounts');
  const num = useNum();
  const monthLabel = useMonthLabel();
  const errorMessage = useApiErrorMessage();
  const postDrafts = usePostDrafts();
  const month = periods.toClose;
  const trial = useTrialBalance(month ?? 'all', { enabled: month !== null });

  if (!month) {
    return (
      <section className={cn(card, 'text-muted px-6 py-16 text-center text-sm')}>
        {periods.closedThrough ? t('closeTab.allClosed') : t('closeTab.nothingToClose')}
      </section>
    );
  }

  // Closing a month closes every open month before it too.
  const closing = periods.open.filter((m) => m.ended && m.month <= month);
  const withDrafts = closing.filter((m) => m.drafts > 0);
  const drafts = withDrafts.reduce((s, m) => s + m.drafts, 0);
  const earlier = closing.length - 1;
  const balanced = trial.data?.balanced ?? true;
  const difference = trial.data ? Math.abs(trial.data.totalDebit - trial.data.totalCredit) : 0;

  async function postAll() {
    try {
      let posted = 0;
      for (const m of withDrafts) posted += (await postDrafts.mutateAsync(m.month)).posted;
      toast.success(t('closeTab.posted', { count: posted }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const checks = [
    {
      id: 'drafts',
      ok: drafts === 0,
      detail: drafts === 0 ? t('closeTab.checks.drafts.ok') : t('closeTab.checks.drafts.fail', { count: drafts }),
      action:
        drafts > 0 ? (
          <button type="button" disabled={postDrafts.isPending} onClick={postAll} className={cn(outlineBtn, 'h-9 px-3')}>
            {t('closeTab.postDrafts')}
          </button>
        ) : null,
    },
    {
      id: 'balanced',
      ok: balanced,
      detail: balanced
        ? t('closeTab.checks.balanced.ok')
        : t('closeTab.checks.balanced.fail', { amount: num(difference) }),
      action: null,
    },
  ];
  const canClose = checks.every((c) => c.ok);

  return (
    <section className={card}>
      <h2 className="text-ink px-5 pt-5 pb-3 text-base font-extrabold">
        {t('closeTab.title', { month: monthLabel(month) })}
      </h2>

      <div className="divide-line divide-y px-5">
        {checks.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-4">
            {c.ok ? (
              <CheckCircle2 className="text-brand size-5 shrink-0" />
            ) : (
              <XCircle className="text-danger size-5 shrink-0" />
            )}
            <div className="min-w-0 flex-1 text-start">
              <p className="text-ink text-sm font-extrabold">{t(`closeTab.checks.${c.id}.title`)}</p>
              <p className={cn('mt-0.5 text-[11px]', c.ok ? 'text-muted' : 'text-danger')}>{c.detail}</p>
            </div>
            {c.action}
          </div>
        ))}
        {periods.pendingCheques > 0 && (
          <div className="flex items-start gap-3 py-4">
            <AlertTriangle className="text-amber-700 mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1 text-start">
              <p className="text-ink text-sm font-extrabold">{t('closeTab.pendingCheques.title')}</p>
              <p className="text-muted mt-0.5 text-[11px] leading-5">
                {t('closeTab.pendingCheques.detail', { count: periods.pendingCheques })}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3 py-4">
          <Info className="text-info mt-0.5 size-5 shrink-0" />
          <p className="text-muted min-w-0 flex-1 text-[11px] leading-5">
            {earlier > 0 ? t('closeTab.earlier', { count: earlier }) : t('closeTab.whatClosing')}
          </p>
        </div>
      </div>

      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t p-5">
        <p className={cn('text-xs font-semibold', canClose ? 'text-brand-deep' : 'text-muted')}>
          {canClose ? t('closeTab.ready') : t('closeTab.notReady')}
        </p>
        <button
          type="button"
          disabled={!canClose}
          onClick={onRequestClose}
          className="bg-brand hover:bg-brand-deep rounded-btn h-10 px-4 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('close.closeButton', { month: monthLabel(month, false) })}
        </button>
      </div>
    </section>
  );
}
