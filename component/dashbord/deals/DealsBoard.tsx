// components/deals/DealsBoard.tsx
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { TrendingDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Owner } from '@/lib/mock/customers';
import { STAGES, type Deal, type DealStage } from '@/lib/mock/deals';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import DealColumn from './DealColumn';

const LOST_ID = 'lost';

// بالماوس بنعتمد على مكان المؤشر، وبالكيبورد على تقاطع المستطيلات
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

// منطقة "خسرنا": بتظهر تحت الشاشة وإنت بتسحب بس
function LostZone() {
  const t = useTranslations('Deals.lost');
  const { setNodeRef, isOver } = useDroppable({ id: LOST_ID });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:ps-[calc(16rem+1rem)]">
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-card pointer-events-auto flex w-full max-w-xl items-center justify-center gap-2 border-2 border-dashed px-4 py-5 text-sm font-bold shadow-lg transition-colors',
          isOver
            ? 'border-danger bg-danger-soft text-danger'
            : 'border-danger/40 bg-surface/95 text-danger/80 backdrop-blur',
        )}
      >
        <TrendingDown className="size-4" />
        {t('zone')}
      </div>
    </div>
  );
}

export default function DealsBoard({
  deals,
  owners,
  onMove,
  onEdit,
  onDelete,
  onLose,
}: {
  deals: Deal[];
  owners: Owner[];
  onMove: (id: string, stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onLose: (deal: Deal) => void;
}) {
  const t = useTranslations('Deals');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const active = deals.find((d) => d.id === activeId) ?? null;

  const titleOf = (id: unknown) =>
    deals.find((d) => d.id === String(id))?.title ?? '';
  const stageOf = (id: unknown) =>
    String(id) === LOST_ID ? t('lost.zoneLabel') : t(`stages.${String(id)}`);

  const announcements: Announcements = {
    onDragStart: ({ active }) => t('a11y.start', { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) =>
      over
        ? t('a11y.over', { title: titleOf(active.id), stage: stageOf(over.id) })
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t('a11y.end', { title: titleOf(active.id), stage: stageOf(over.id) })
        : t('a11y.cancel'),
    onDragCancel: () => t('a11y.cancel'),
  };

  function handleEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const deal = deals.find((d) => d.id === active.id);
    if (!deal) return;

    // الإفلات في منطقة "خسرنا" بيفتح نافذة السبب بدل ما يغيّر الصفقة على طول
    if (over.id === LOST_ID) {
      onLose(deal);
      return;
    }

    const target = STAGES.find((stage) => stage.key === over.id)?.key;
    if (target && deal.stage !== target) onMove(deal.id, target);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t('a11y.instructions') },
      }}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="rounded-card border-line bg-surface border p-3 shadow-sm sm:p-4">
        {/* اللوحة بتتحرك أفقياً، وأعمدتها بنفس الطول علشان الإفلات يبقى سهل */}
        <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4">
          <div className="flex items-stretch gap-3 sm:gap-4">
            {STAGES.map((s) => (
              <DealColumn
                key={s.key}
                stage={s.key}
                dot={s.dot}
                deals={deals.filter((d) => d.stage === s.key)}
                owners={owners}
                onMove={onMove}
                onEdit={onEdit}
                onDelete={onDelete}
                onLose={onLose}
              />
            ))}
          </div>
        </div>
      </div>

      {active && <LostZone />}

      <DragOverlay dropAnimation={null}>
        {active ? <DealCard deal={active} owners={owners} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}