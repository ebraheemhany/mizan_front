// components/deals/DealColumn.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import { useFormatter, useTranslations } from 'next-intl';
import type { Owner } from '@/lib/mock/customers';
import { weightedValue, type Deal, type DealStage } from '@/lib/mock/deals';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import DraggableDeal from './DraggableDeal';

export default function DealColumn({
  stage,
  dot,
  deals,
  owners,
  onMove,
  onEdit,
  onDelete,
  onLose,
}: {
  stage: DealStage;
  dot: string;
  deals: Deal[];
  owners: Owner[];
  onMove: (id: string, stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onLose: (deal: Deal) => void;
}) {
  const t = useTranslations('Deals');
  const format = useFormatter();
  const money = useMoney();
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const total = deals.reduce((sum, d) => sum + d.value, 0);
  const expected = Math.round(deals.reduce((sum, d) => sum + weightedValue(d), 0));

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`stage-${stage}`}
      className={cn(
        'bg-neutral-soft/60 border-line rounded-card flex min-h-80 w-[78%] shrink-0 flex-col border p-3 transition-colors sm:w-auto sm:min-w-52 sm:flex-1',
        isOver && 'border-brand/60 bg-brand-soft/60 ring-brand/20 ring-2',
      )}
    >
      <header className="mb-3 px-1">
        <div className="flex items-center justify-between gap-2">
          <h2
            id={`stage-${stage}`}
            className="text-ink flex items-center gap-2 text-sm font-extrabold"
          >
            <i className={cn('size-2.5 rounded-full', dot)} />
            {t(`stages.${stage}`)}
          </h2>

          <span className="bg-surface text-ink-2 border-line rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums">
            {format.number(deals.length, { numberingSystem: 'latn' })}
          </span>
        </div>

        <p className="text-muted mt-1 text-xs font-semibold tabular-nums">{money(total)}</p>
        {stage !== 'won' && (
          <p className="text-brand-deep mt-0.5 text-[11px] font-semibold tabular-nums">
            {t('column.expected', { amount: money(expected) })}
          </p>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-2.5">
        {deals.length === 0 ? (
          <div className="border-line-strong text-muted rounded-xl border border-dashed px-3 py-8 text-center text-xs">
            {t('column.empty')}
          </div>
        ) : (
          deals.map((d) => (
            <DraggableDeal
              key={d.id}
              deal={d}
              owners={owners}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
              onLose={onLose}
            />
          ))
        )}
      </div>
    </section>
  );
}