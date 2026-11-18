// component/dashbord/reports/RevenueExpensesChart.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useMoney } from '@/lib/money';
import type { MonthlyPoint } from '@/lib/reports/hooks';
import { monthToDate, niceMax } from './utils';

export default function RevenueExpensesChart({
  series,
}: {
  series: MonthlyPoint[];
}) {
  const t = useTranslations('Reports.chart');
  const format = useFormatter();
  const money = useMoney();

  // A round top for the scale; all-zero months get flat bars instead of NaN heights.
  const top = niceMax(Math.max(0, ...series.flatMap((p) => [p.revenue, p.expenses])));
  const height = (value: number) => `${(Math.max(0, value) / top) * 100}%`;

  return (
    <div className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <div dir="ltr" className="mt-6 flex items-end justify-between gap-2">
        {series.map((point) => (
          <div
            key={point.month}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-48 items-end gap-1">
              <div
                title={`${t('revenue')}: ${money(point.revenue)}`}
                className="bg-brand w-3.5 rounded-t-md sm:w-5"
                style={{ height: height(point.revenue) }}
              />
              {/* TODO: نبدّل اللون الثابت بتوكن المصروفات لو اتعرّف في globals.css */}
              <div
                title={`${t('expenses')}: ${money(point.expenses)}`}
                className="w-3.5 rounded-t-md bg-[#dba35a] sm:w-5"
                style={{ height: height(point.expenses) }}
              />
            </div>
            <span className="text-muted text-[11px] font-semibold">
              {format.dateTime(monthToDate(point.month), {
                month: 'long',
                timeZone: 'UTC',
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="text-ink-2 mt-5 flex items-center justify-center gap-5 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-brand size-2 rounded-full" />
          {t('revenue')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#dba35a]" />
          {t('expenses')}
        </span>
      </div>
    </div>
  );
}
