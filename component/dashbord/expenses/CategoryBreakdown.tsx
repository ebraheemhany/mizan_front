// component/dashbord/expenses/CategoryBreakdown.tsx
'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import type { ExpenseCategory } from '@/lib/mock/expenses';

// TODO: لو اتعرّفت توكنز لألوان التصنيفات في globals.css نبدّل الألوان دي
const BAR: Record<ExpenseCategory, string> = {
  salaries: 'bg-brand',
  rent: 'bg-info',
  purchases: 'bg-[#dba35a]',
  marketing: 'bg-amber-800',
  utilities: 'bg-brand-mint',
  software: 'bg-muted',
};

export default function CategoryBreakdown({
  totals,
  loading = false,
}: {
  totals: { key: ExpenseCategory; amount: number }[];
  /** While the totals aren't known yet (loading or failed): no "no expenses" message. */
  loading?: boolean;
}) {
  const t = useTranslations('Expenses');
  const money = useMoney();

  const max = Math.max(...totals.map((c) => c.amount), 1);

  return (
    <div className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">
        {t('breakdown.title')}
      </h2>

      {loading ? (
        <p className="text-muted mt-4 text-xs">—</p>
      ) : totals.length === 0 ? (
        <p className="text-muted mt-4 text-xs">{t('breakdown.empty')}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {totals.map((c) => (
            <li key={c.key}>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-ink font-bold">
                  {t(`categories.${c.key}`)}
                </span>
                <span className="text-muted font-semibold tabular-nums">
                  {money(c.amount)}
                </span>
              </div>
              <div className="bg-neutral-soft mt-2 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', BAR[c.key])}
                  style={{ width: `${(c.amount / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}