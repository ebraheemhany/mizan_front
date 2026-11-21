// components/deals/DraggableDeal.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Deal, DealStage } from '@/lib/deals/model';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import DealMenu from './DealMenu';
import { useDealBoardActions } from './deal-actions';

export default function DraggableDeal({
  deal,
  onMove,
  onEdit,
  onDelete,
  onLose,
}: {
  deal: Deal;
  onMove: (id: string, stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onLose: (deal: Deal) => void;
}) {
  const { readOnly, onTouch, onInvoice, onAddTask } = useDealBoardActions();
  // A won deal doesn't move by dragging (only by "undo"); viewers can't move any.
  const locked = deal.stage === 'won' || readOnly;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    disabled: locked,
  });

  return (
    <div
      ref={setNodeRef}
      {...(locked ? {} : { ...attributes, ...listeners })}
      className={cn(
        'focus-visible:ring-brand/40 touch-manipulation rounded-xl outline-none focus-visible:ring-2',
        isDragging && 'opacity-40',
      )}
    >
      <DealCard
        deal={deal}
        menu={
          readOnly ? null : (
            <DealMenu
              deal={deal}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
              onLose={onLose}
              onTouch={onTouch}
              onInvoice={onInvoice}
              onAddTask={onAddTask}
            />
          )
        }
      />
    </div>
  );
}
