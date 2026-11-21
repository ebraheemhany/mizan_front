// components/deals/FunnelCard.tsx
'use client';

import { useMemo } from 'react';
import { Funnel, TrendingDown } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { STAGES, type Deal } from '@/lib/deals/model';
import { cn } from '@/lib/utils';
import { buildFunnel, previousStage } from './funnel';

export default function FunnelCard({ deals }: { deals: Deal[] }) {
  const t = useTranslations('Deals.funnel');
  const ts = useTranslations('Deals.stages');
  const format = useFormatter();

  const steps = useMemo(() => buildFunnel(deals), [deals]);

  const total = steps[0].reached;
  const won = steps[steps.length - 1].reached;
  const overall = total ? won / total : 0;

  // أضعف انتقال بين مرحلتين
  const measured = steps.filter((s) => s.rate !== null);
  const weakest = measured.length
    ? measured.reduce((a, b) =>
        (b.rate as number) < (a.rate as number) ? b : a,
      )
    : null;
  const showWeakest = weakest !== null && (weakest.rate as number) < 1;

  const n = (v: number) => format.number(v, { numberingSystem: 'latn' });
  const pct = (v: number) =>
    format.number(v, {
      style: 'percent',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    });

  return (
    <section className="rounded-card border-line bg-surface border p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-brand-soft text-brand flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Funnel className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
            <p className="text-muted mt-1 text-xs leading-5">{t('subtitle')}</p>
          </div>
        </div>
        <span className="bg-neutral-soft text-ink-2 rounded-full px-3 py-1.5 text-[11px] font-semibold">
          {t('note')}
        </span>
      </div>

      {total === 0 ? (
        <div className="bg-canvas/60 mt-5 flex flex-col items-center rounded-xl px-4 py-10 text-center">
          <span className="bg-surface text-muted mb-3 flex size-11 items-center justify-center rounded-full">
            <Funnel className="size-5" />
          </span>
          <p className="text-muted max-w-sm text-sm leading-6">{t('empty')}</p>
        </div>
      ) : (
        <>
          <ol className="mt-6 space-y-4">
            {steps.map((s) => {
              const isWeakest = showWeakest && weakest?.stage === s.stage;
              const dot =
                STAGES.find((x) => x.key === s.stage)?.dot ?? 'bg-muted';

              return (
                <li key={s.stage} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <i className={cn('size-2.5 shrink-0 rounded-full', dot)} />
                      <span className="text-ink-2 truncate text-xs font-bold sm:text-sm">
                        {ts(s.stage)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-ink text-sm font-extrabold tabular-nums">
                        {n(s.reached)}
                        <span className="sr-only">
                          {' '}
                          {t('reached', { count: s.reached })}
                        </span>
                      </span>
                      {s.rate !== null && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                            isWeakest
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-soft text-ink-2',
                          )}
                        >
                          {pct(s.rate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="bg-neutral-soft h-2.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`${ts(s.stage)}: ${pct(s.widthPct / 100)}`}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-500',
                        dot,
                      )}
                      style={{
                        width: `${s.reached ? Math.max(s.widthPct, 3) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="border-line mt-6 grid gap-3 border-t pt-5 sm:grid-cols-2">
            <div className="bg-brand-soft/60 rounded-xl p-4">
              <p className="text-brand-deep text-xs font-bold">{t('overallLabel')}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-brand text-2xl font-extrabold tabular-nums">
                  {pct(overall)}
                </p>
                <p className="text-muted text-xs">
                  {t('overallHint', { from: ts('lead'), to: ts('won') })}
                </p>
              </div>
            </div>

            {showWeakest && weakest && (
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <TrendingDown className="size-3.5" />
                  <p className="text-xs font-bold">{t('weakestLabel')}</p>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-amber-700 tabular-nums">
                    {pct(weakest.rate as number)}
                  </p>
                  <p className="text-muted text-xs">
                    {t('weakestHint', {
                      from: ts(previousStage(weakest.stage)),
                      to: ts(weakest.stage),
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
