// components/recurring/RecurringStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import StatCard from '@/component/StatCard';
import type { RecurringList } from '@/lib/recurring/hooks';
import { useMoney, useMoneyParts } from '@/lib/money';

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

/** From the server, over all of the company's templates (not just the filtered ones). */
export default function RecurringStats({ stats }: { stats: RecurringList['stats'] | undefined }) {
  const t = useTranslations('Recurring.stats');
  const format = useFormatter();
  const money = useMoney();
  const n = (v: number) => format.number(v, { numberingSystem: 'latn' });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        tone="brand"
        label={t('mrr')}
        value={stats ? <Amount amount={stats.mrr} /> : '—'}
        hint={stats ? t('mrrHint', { count: stats.active }) : ''}
      />
      <StatCard
        label={t('active')}
        value={stats ? n(stats.active) : '—'}
        hint={stats ? t('activeHint', { count: stats.paused }) : ''}
      />
      <StatCard
        label={t('upcoming')}
        value={stats ? n(stats.upcoming.count) : '—'}
        hint={stats ? t('upcomingHint', { amount: money(stats.upcoming.total) }) : ''}
      />
    </div>
  );
}
