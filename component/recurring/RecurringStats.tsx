// components/recurring/RecurringStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import StatCard from '@/component/StatCard';
import { daysUntil } from '@/lib/relative-time';
import { MOCK_NOW } from '@/lib/mock/invoices';
import { MONTHLY_FACTOR, type RecurringInvoice } from '@/lib/mock/recurring';
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

export default function RecurringStats({
  items,
}: {
  items: RecurringInvoice[];
}) {
  const t = useTranslations('Recurring.stats');
  const format = useFormatter();
  const money = useMoney();

  const active = items.filter((i) => i.status === 'active');
  const pausedCount = items.filter((i) => i.status === 'paused').length;

  const mrr = Math.round(
    active.reduce((sum, i) => sum + i.amount * MONTHLY_FACTOR[i.frequency], 0),
  );

  // القوالب النشطة اللي فاتورتها القادمة خلال 7 أيام
  const upcoming = active.filter((i) => {
    if (!i.nextDate) return false;
    const days = daysUntil(i.nextDate, MOCK_NOW);
    return days >= 0 && days <= 7;
  });
  const upcomingValue = upcoming.reduce((sum, i) => sum + i.amount, 0);

  const n = (v: number) => format.number(v, { numberingSystem: 'latn' });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        tone="brand"
        label={t('mrr')}
        value={<Amount amount={mrr} />}
        hint={t('mrrHint', { count: active.length })}
      />
      <StatCard
        label={t('active')}
        value={n(active.length)}
        hint={t('activeHint', { count: pausedCount })}
      />
      <StatCard
        label={t('upcoming')}
        value={n(upcoming.length)}
        hint={t('upcomingHint', { amount: money(upcomingValue) })}
      />
    </div>
  );
}
