// components/quotes/QuotesStats.tsx
'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import Amount from '@/component/Amount';
import StatCard from '@/component/StatCard';
import type { Quote } from '@/lib/mock/quotes';
import { computeStats } from './utils';

export default function QuotesStats({ quotes }: { quotes: Quote[] }) {
  const t = useTranslations('Quotes.stats');
  const format = useFormatter();
  const s = useMemo(() => computeStats(quotes), [quotes]);

  const rate = s.rate === null ? null : Math.round(s.rate * 100);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label={t('waiting')}
        value={<Amount amount={s.waiting.total} />}
        hint={t('waitingHint', { count: s.waiting.count })}
      />
      <StatCard
        tone="brand"
        label={t('accepted')}
        value={<Amount amount={s.accepted.total} />}
        hint={t('acceptedHint', { count: s.accepted.count })}
      />
      <StatCard
        tone="warning"
        label={t('expiring')}
        value={<Amount amount={s.expiring.total} />}
        hint={t('expiringHint', { count: s.expiring.count })}
      />
      <StatCard
        label={t('rate')}
        value={
          rate === null ? (
            '—'
          ) : (
            <>
              {format.number(rate, { numberingSystem: 'latn' })}
              <span className="text-muted ms-1.5 text-xs font-semibold">%</span>
            </>
          )
        }
        hint={rate === null ? t('rateEmpty') : t('rateHint')}
      />
    </div>
  );
}
