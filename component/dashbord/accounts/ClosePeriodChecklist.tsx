// component/dashbord/accounts/ClosePeriodChecklist.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { FiscalPeriod, JournalEntry } from '@/lib/mock/accounts';
import { computeTrial } from '@/lib/trial-balance';

type Props = {
  period?: FiscalPeriod; // الشهر المفتوح
  periods: FiscalPeriod[];
  entries: JournalEntry[];
  monthLabel: string;
  unpostedText: (count: number) => string;
  onPostDrafts: (periodId: string) => void;
  onRequestClose: () => void;
};

const card = 'rounded-card border-line bg-surface border shadow-sm';

export default function ClosePeriodChecklist({
  period,
  periods,
  entries,
  monthLabel,
  unpostedText,
  onPostDrafts,
  onRequestClose,
}: Props) {
  const t = useTranslations('Accounts');
  const format = useFormatter();
  const num = (n: number) =>
    format.number(n, { numberingSystem: 'latn', maximumFractionDigits: 2 });

  if (!period) {
    return (
      <section className={cn(card, 'text-muted py-16 text-center text-sm')}>
        {t('closeTab.allClosed')}
      </section>
    );
  }

  const drafts = entries.filter(
    (e) => e.status === 'draft' && e.date.startsWith(period.id),
  ).length;
  const trial = computeTrial(entries, period.id);
  // الفترات الشهرية الأقدم اللي لسه مفتوحة
  const previousOpen = periods.filter(
    (p) => p.kind === 'month' && p.status !== 'closed' && p.id < period.id,
  ).length;

  const checks = [
    {
      id: 'drafts',
      ok: drafts === 0,
      detail:
        drafts === 0
          ? t('closeTab.checks.drafts.ok')
          : t('closeTab.checks.drafts.fail', { unposted: unpostedText(drafts) }),
      action:
        drafts > 0 ? (
          <button
            type="button"
            onClick={() => onPostDrafts(period.id)}
            className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn h-9 shrink-0 border px-3 text-xs font-bold transition-colors"
          >
            {t('closeTab.postDrafts')}
          </button>
        ) : null,
    },
    {
      id: 'balanced',
      ok: trial.balanced,
      detail: trial.balanced
        ? t('closeTab.checks.balanced.ok')
        : t('closeTab.checks.balanced.fail', { amount: num(Math.abs(trial.difference)) }),
      action: null,
    },
    {
      id: 'previous',
      ok: previousOpen === 0,
      detail:
        previousOpen === 0
          ? t('closeTab.checks.previous.ok')
          : t('closeTab.checks.previous.fail', { text: num(previousOpen) }),
      action: null,
    },
  ];

  const canClose = checks.every((c) => c.ok);

  return (
    <section className={card}>
      <h2 className="text-ink px-5 pt-5 pb-3 text-base font-extrabold">
        {t('closeTab.title', { month: monthLabel })}
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
              <p className="text-ink text-sm font-extrabold">
                {t(`closeTab.checks.${c.id}.title`)}
              </p>
              <p className={cn('mt-0.5 text-[11px]', c.ok ? 'text-muted' : 'text-danger')}>
                {c.detail}
              </p>
            </div>
            {c.action}
          </div>
        ))}
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
          {t('close.closeButton', { month: monthLabel })}
        </button>
      </div>
    </section>
  );
}