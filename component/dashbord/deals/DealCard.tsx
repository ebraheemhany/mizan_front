// components/deals/DealCard.tsx
'use client';

import { Clock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { OWNERS, type Owner } from '@/lib/mock/customers';
import { getDealTag, probabilityOf, type Deal } from '@/lib/mock/deals';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

export default function DealCard({
  deal,
  owners = OWNERS,
  overlay,
  menu,
}: {
  deal: Deal;
  owners?: Owner[];
  overlay?: boolean;
  menu?: React.ReactNode;
}) {
  const t = useTranslations('Deals.card');
  const format = useFormatter();
  const money = useMoney();

  const owner = owners.find((o) => o.id === deal.ownerId);
  const tag = getDealTag(deal);
  const won = deal.stage === 'won';

  return (
    <article
      className={cn(
        'border-line bg-surface rounded-xl border p-3.5 shadow-sm transition',
        !won && !overlay && 'hover:border-brand/60 cursor-grab hover:shadow-md',
        overlay && 'ring-brand/50 rotate-2 cursor-grabbing shadow-xl ring-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-ink text-sm leading-6 font-bold">{deal.title}</h3>

        <div className="mt-0.5 flex shrink-0 items-center gap-1">
          {owner && (
            <span
              title={t('owner', { name: owner.name })}
              className="bg-brand-soft text-brand-deep flex size-6 items-center justify-center rounded-full text-[11px] font-extrabold"
            >
              {owner.name.charAt(0)}
              <span className="sr-only">
                {t('owner', { name: owner.name })}
              </span>
            </span>
          )}
          {menu}
        </div>
      </div>

      <p className="text-muted mt-0.5 truncate text-xs">{deal.customer}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p
          className={cn(
            'text-base font-extrabold tabular-nums',
            won ? 'text-brand' : 'text-ink',
          )}
        >
          {money(deal.value)}
        </p>

        {!won && (
          <span className="bg-neutral-soft text-ink-2 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums">
            {format.number(probabilityOf(deal.stage), {
              style: 'percent',
              numberingSystem: 'latn',
            })}
          </span>
        )}
      </div>

      {tag && (
        <p
          className={cn(
            'mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
            tag.kind === 'followUpToday'
              ? 'bg-brand-soft text-brand-deep'
              : 'bg-amber-100 text-amber-800',
          )}
        >
          {tag.kind === 'followUpToday' ? (
            t('followUpToday')
          ) : (
            <>
              <Clock className="size-3" />
              {t(tag.kind, { days: t('days', { count: tag.days }) })}
            </>
          )}
        </p>
      )}
    </article>
  );
}
