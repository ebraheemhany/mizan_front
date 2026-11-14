// components/dashboard/RevenueChart.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { CHART_DATA, CHART_MAX, CHART_TICKS } from '@/lib/mock/dashboard';
import { useMoney } from '@/lib/money';

const pct = (v: number) => `${(v / CHART_MAX) * 100}%`;

export default function RevenueChart() {
  const t = useTranslations('Dashboard.chart');
  const format = useFormatter();
  const money = useMoney();

  const monthName = (m: number) =>
    format.dateTime(new Date(Date.UTC(2026, m, 1)), { month: 'long', timeZone: 'UTC' });

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

        <div className="text-muted flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <i className="bg-brand size-2.5 rounded-[3px]" />
            {t('revenue')}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-[3px] bg-[#dba35a]" />
            {t('expenses')}
          </span>
        </div>
      </div>

      <div role="img" aria-label={t('summary')} className="mt-6 flex gap-3">
        {/* محور القيم */}
        <div className="relative h-56 w-9 shrink-0">
          {CHART_TICKS.map((v) => (
            <span
              key={v}
              className="text-muted absolute start-0 translate-y-1/2 text-[11px] tabular-nums"
              style={{ bottom: pct(v) }}
            >
              {v === 0 ? '0' : `${v / 1000}k`}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-56">
            {/* خطوط الشبكة */}
            {CHART_TICKS.map((v) => (
              <div
                key={v}
                className="bg-line absolute inset-x-0 h-px"
                style={{ bottom: pct(v) }}
              />
            ))}

            {/* الأعمدة */}
            <div className="relative flex h-full">
              {CHART_DATA.map((d) => (
                <div
                  key={d.month}
                  tabIndex={0}
                  className="group relative flex h-full flex-1 items-end justify-center gap-1 outline-none"
                >
                  <div className="bg-brand w-4 rounded-t-md sm:w-5" style={{ height: pct(d.revenue) }} />
                  <div
                    className="w-4 rounded-t-md bg-[#dba35a] sm:w-5"
                    style={{ height: pct(d.expenses) }}
                  />

                  <div
                    className="bg-ink pointer-events-none absolute left-1/2 z-10 w-max -translate-x-1/2 rounded-lg px-3 py-2 text-[11px] leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    style={{ bottom: `calc(${pct(Math.max(d.revenue, d.expenses))} + 8px)` }}
                  >
                    <p className="font-bold">{monthName(d.month)}</p>
                    <p>
                      {t('revenue')}: {money(d.revenue)}
                    </p>
                    <p>
                      {t('expenses')}: {money(d.expenses)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* أسماء الشهور */}
          <div className="mt-2 flex">
            {CHART_DATA.map((d) => (
              <span key={d.month} className="text-muted flex-1 text-center text-xs">
                {monthName(d.month)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}