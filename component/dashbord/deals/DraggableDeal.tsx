// components/deals/DraggableDeal.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Owner } from '@/lib/mock/customers';
import type { Deal, DealStage } from '@/lib/mock/deals';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import DealMenu from './DealMenu';

export default function DraggableDeal({
  deal,
  owners,
  onMove,
  onEdit,
  onDelete,
  onLose,
}: {
  deal: Deal;
  owners: Owner[];
  onMove: (id: string, stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onLose: (deal: Deal) => void;
}) {
  const locked = deal.stage === 'won'; // الصفقة المغلقة ما تتسحبش ولا تتنقل
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
        owners={owners}
        menu={
          <DealMenu
            deal={deal}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
            onLose={onLose}
          />
        }
      />
    </div>
  );
}