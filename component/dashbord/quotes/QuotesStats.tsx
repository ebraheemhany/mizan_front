// components/quotes/QuotesStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import Amount from '@/component/Amount';
import StatCard from '@/component/StatCard';
import type { QuoteStats } from '@/lib/quotes/hooks';

const EMPTY = { count: 0, total: 0 };

/** The four cards at the top of the quotes page (GET /api/quotes/stats). */
export default function QuotesStats({ stats }: { stats?: QuoteStats }) {
  const t = useTranslations('Quotes.stats');
  const format = useFormatter();

  const waiting = stats?.waiting ?? EMPTY;
  const accepted = stats?.accepted ?? EMPTY;
  const expiring = stats?.expiring ?? EMPTY;
  const rate = stats?.acceptanceRate == null ? null : Math.round(stats.acceptanceRate);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label={t('waiting')}
        value={<Amount amount={waiting.total} />}
        hint={t('waitingHint', { count: waiting.count })}
      />
      <StatCard
        tone="brand"
        label={t('accepted')}
        value={<Amount amount={accepted.total} />}
        hint={t('acceptedHint', { count: accepted.count })}
      />
      <StatCard
        tone="warning"
        label={t('expiring')}
        value={<Amount amount={expiring.total} />}
        hint={t('expiringHint', { count: expiring.count })}
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
