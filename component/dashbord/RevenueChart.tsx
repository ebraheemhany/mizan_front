// components/dashboard/RevenueChart.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMoney } from '@/lib/money';
import { useDashboard } from '@/lib/payments/hooks';

/** A round top for the scale (1, 2, 2.5 or 5 x a power of ten), so ticks read nicely. */
function niceMax(value: number) {
  if (value <= 0) return 1000;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10;
  return step * power;
}

const shortAmount = (v: number) =>
  v === 0 ? '0' : v >= 1_000_000 ? `${v / 1_000_000}m` : v >= 1000 ? `${v / 1000}k` : String(v);

export default function RevenueChart() {
  const t = useTranslations('Dashboard.chart');
  const format = useFormatter();
  const money = useMoney();
  const { data } = useDashboard();

  // Only for roles that may see financial reports.
  if (!data?.financials) return null;

  const points = data.financials.chart.map((d) => ({
    month: d.month,
    revenue: Number(d.revenue),
    expenses: Number(d.expenses),
  }));
  const max = niceMax(Math.max(...points.map((p) => Math.max(p.revenue, p.expenses))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const pct = (v: number) => `${(v / max) * 100}%`;

  // "2026-10" -> "October"
  const monthName = (month: string) =>
    format.dateTime(new Date(`${month}-01T00:00:00Z`), { month: 'long', timeZone: 'UTC' });

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
          {ticks.map((v) => (
            <span
              key={v}
              className="text-muted absolute start-0 translate-y-1/2 text-[11px] tabular-nums"
              style={{ bottom: pct(v) }}
            >
              {shortAmount(v)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-56">
            {/* خطوط الشبكة */}
            {ticks.map((v) => (
              <div key={v} className="bg-line absolute inset-x-0 h-px" style={{ bottom: pct(v) }} />
            ))}

            {/* الأعمدة */}
            <div className="relative flex h-full">
              {points.map((d) => (
                <div
                  key={d.month}
                  tabIndex={0}
                  className="group relative flex h-full flex-1 items-end justify-center gap-1 outline-none"
                >
                  <div className="bg-brand w-4 rounded-t-md sm:w-5" style={{ height: pct(d.revenue) }} />
                  <div className="w-4 rounded-t-md bg-[#dba35a] sm:w-5" style={{ height: pct(d.expenses) }} />

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
            {points.map((d) => (
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
