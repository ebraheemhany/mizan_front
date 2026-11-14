// components/deals/LostDealsCard.tsx
'use client';

import { RotateCcw } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useDate } from '@/lib/data';
import { isLost, LOSS_REASONS, type Deal } from '@/lib/mock/deals';
import { useMoney } from '@/lib/money';

export default function LostDealsCard({
  deals,
  onReopen,
}: {
  deals: Deal[];
  onReopen: (deal: Deal) => void;
}) {
  const t = useTranslations('Deals.lost');
  const tr = useTranslations('Deals.lost.reasons');
  const ts = useTranslations('Deals.stages');
  const format = useFormatter();
  const money = useMoney();
  const date = useDate();

  const lost = deals.filter(isLost).sort((a, b) => b.lost.date.localeCompare(a.lost.date));
  const totalValue = lost.reduce((sum, d) => sum + d.value, 0);

  const byReason = LOSS_REASONS.map((reason) => ({
    reason,
    count: lost.filter((d) => d.lost.reason === reason).length,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const max = byReason[0]?.count ?? 1;

  const pct = (v: number) =>
    format.number(v, { style: 'percent', maximumFractionDigits: 0, numberingSystem: 'latn' });
  const n = (v: number) => format.number(v, { numberingSystem: 'latn' });

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-ink text-base font-extrabold">{t('card.title')}</h2>
        {lost.length > 0 && (
          <p className="text-muted text-xs font-semibold tabular-nums">
            {t('card.summary', { count: lost.length, amount: money(totalValue) })}
          </p>
        )}
      </div>

      {lost.length === 0 ? (
        <p className="text-muted py-8 text-center text-sm">{t('card.empty')}</p>
      ) : (
        <>
          {/* توزيع الأسباب */}
          <div className="mt-5">
            <h3 className="text-ink-2 mb-3 text-xs font-bold">{t('card.reasonsTitle')}</h3>
            <ul className="space-y-2.5">
              {byReason.map(({ reason, count }) => (
                <li
                  key={reason}
                  className="grid grid-cols-[7.5rem_minmax(0,1fr)_5rem] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_6rem]"
                >
                  <span className="text-ink-2 truncate text-xs font-semibold">{tr(reason)}</span>

                  <div className="bg-neutral-soft h-2.5 overflow-hidden rounded-full">
                    <div
                      className="bg-danger/70 h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>

                  <span className="text-muted text-end text-xs font-bold tabular-nums">
                    {n(count)} · {pct(count / lost.length)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* القائمة */}
          <ul className="divide-line border-line mt-5 divide-y border-t">
            {lost.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-sm font-bold">{d.title}</p>
                  <p className="text-muted truncate text-xs">
                    {d.customer} · {t('card.fromStage', { stage: ts(d.stage) })} · {date(d.lost.date)}
                  </p>
                  {d.lost.note && <p className="text-body mt-1 text-xs">{d.lost.note}</p>}
                </div>

                <span className="bg-danger-soft text-danger rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap">
                  {tr(d.lost.reason)}
                </span>

                <span className="text-ink text-sm font-extrabold whitespace-nowrap tabular-nums">
                  {money(d.value)}
                </span>

                <Button
                  variant="ghost"
                  onClick={() => onReopen(d)}
                  className="text-brand hover:bg-brand-soft hover:text-brand h-8 gap-1.5 px-2.5 text-xs font-bold"
                >
                  <RotateCcw className="size-3.5" />
                  {t('reopen')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}