// component/dashbord/reports/AgingCard.tsx
'use client';

import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useMoney } from '@/lib/money';
import type { AgingBucket, AgingBucketKey } from '@/lib/reports/hooks';
import { cn } from '@/lib/utils';

const BAR: Record<AgingBucketKey, string> = {
  notDue: 'bg-brand',
  d1_30: 'bg-[#dba35a]',
  d31_60: 'bg-amber-800',
  d60plus: 'bg-danger',
};

export default function AgingCard({ buckets }: { buckets: AgingBucket[] }) {
  const t = useTranslations('Reports.aging');
  const money = useMoney();

  const max = Math.max(...buckets.map((b) => b.amount), 1);

  return (
    <div className="rounded-card border-line bg-surface flex flex-col border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <ul className="mt-5 flex-1 space-y-4">
        {buckets.map((b) => (
          <li key={b.key}>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-ink-2 font-semibold">
                {t(`buckets.${b.key}`)}
              </span>
              <span className="text-ink font-bold tabular-nums">
                {money(b.amount)}
              </span>
            </div>
            <div className="bg-neutral-soft mt-2 flex h-1.5 overflow-hidden rounded-full">
              {b.amount > 0 ? (
                <div
                  className={cn('h-full rounded-full', BAR[b.key])}
                  style={{ width: `${(b.amount / max) * 100}%` }}
                />
              ) : (
                <div className={cn('size-1.5 rounded-full', BAR[b.key])} />
              )}
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/invoices"
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas mt-5 h-10 w-fit border text-xs font-bold',
        )}
      >
        {t('cta')}
      </Link>
    </div>
  );
}
