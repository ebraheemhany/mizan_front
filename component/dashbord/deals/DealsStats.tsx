// components/deals/DealsStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import Amount from '@/component/Amount';
import StatCard from '@/component/StatCard';
import {
  isClosedThisMonth,
  isOpen,
  needsAttention,
  weightedValue,
  type Deal,
} from '@/lib/mock/deals';
import { useMoney } from '@/lib/money';

export default function DealsStats({ deals }: { deals: Deal[] }) {
  const t = useTranslations('Deals.stats');
  const format = useFormatter();
  const money = useMoney();

  const open = deals.filter(isOpen);
  const pipeline = open.reduce((sum, d) => sum + d.value, 0);
  const expected = Math.round(
    open.reduce((sum, d) => sum + weightedValue(d), 0),
  );
  const average = open.length ? Math.round(pipeline / open.length) : 0;

  const closed = deals.filter(isClosedThisMonth);
  const closedValue = closed.reduce((sum, d) => sum + d.value, 0);

  const attention = open.filter(needsAttention).length;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label={t('pipeline')}
        value={<Amount amount={pipeline} />}
        hint={t('pipelineHint', { amount: money(average) })}
      />
      <StatCard
        tone="brand"
        label={t('expected')}
        value={<Amount amount={expected} />}
        hint={t('expectedHint')}
      />
      <StatCard
        label={t('closed')}
        value={<Amount amount={closedValue} />}
        hint={t('closedHint', { count: closed.length })}
      />
      <StatCard
        label={t('open')}
        value={format.number(open.length, { numberingSystem: 'latn' })}
        hint={t('openHint', { count: attention })}
        hintTone={attention > 0 ? 'danger' : 'default'}
      />
    </div>
  );
}
