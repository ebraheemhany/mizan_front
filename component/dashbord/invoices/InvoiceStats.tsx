// components/invoices/InvoiceStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { InvoiceStatsData } from '@/lib/invoices/hooks';
import { useMoney, useMoneyParts } from '@/lib/money';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'danger' | 'brand';

function Amount({ amount }: { amount: number }) {
  const parts = useMoneyParts();
  const { number, symbol } = parts(amount);

  return (
    <>
      {number}
      <span className="text-muted ms-1.5 text-xs font-semibold">{symbol}</span>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-card border-line bg-surface border p-5">
      <p className="text-muted text-xs font-semibold">{label}</p>
      <p
        className={cn(
          'mt-2 text-3xl font-extrabold tabular-nums',
          tone === 'danger'
            ? 'text-danger'
            : tone === 'brand'
              ? 'text-brand'
              : 'text-ink',
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'mt-1.5 text-xs font-semibold',
          tone === 'danger'
            ? 'text-danger'
            : tone === 'brand'
              ? 'text-brand-deep'
              : 'text-muted',
        )}
      >
        {hint}
      </p>
    </div>
  );
}

export default function InvoiceStats({
  stats: s,
}: {
  stats: InvoiceStatsData;
}) {
  const t = useTranslations('Invoices.stats');
  const format = useFormatter();
  const money = useMoney();

  const change = format.number(s.collectedChangePct, {
    signDisplay: 'exceptZero',
    numberingSystem: 'latn',
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t('outstanding')}
        value={<Amount amount={s.outstanding} />}
        hint={t('outstandingHint', { count: s.unpaidCount })}
      />
      <StatCard
        tone="danger"
        label={t('overdue')}
        value={<Amount amount={s.overdue} />}
        hint={t('overdueHint', { count: s.overdueCount })}
      />
      <StatCard
        tone="brand"
        label={t('collected')}
        value={<Amount amount={s.collectedThisMonth} />}
        hint={t('collectedHint', { change })}
      />
      <StatCard
        label={t('drafts')}
        value={format.number(s.draftsCount, { numberingSystem: 'latn' })}
        hint={t('draftsHint', { amount: money(s.draftsValue) })}
      />
    </div>
  );
}
