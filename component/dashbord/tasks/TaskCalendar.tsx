// component/dashbord/tasks/TaskCalendar.tsx
'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task, TaskKind } from '@/lib/mock/tasks';
import { monthGrid, shiftMonth, tasksByDate } from './utils';

const KIND: Record<TaskKind, string> = {
  meeting: 'bg-info-soft text-info',
  quote: 'bg-info-soft text-info',
  collection: 'bg-danger-soft text-danger',
  visit: 'bg-brand-soft text-brand-deep',
  deadline: 'bg-amber-50 text-amber-800',
  admin: 'bg-neutral-soft text-ink-2',
};

const MAX_CHIPS = 2;

const navBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-9 border text-xs font-bold';

export default function TaskCalendar({
  month,
  tasks,
  today,
  onMonthChange,
  onDayClick,
}: {
  month: string; // YYYY-MM
  tasks: Task[];
  today: string;
  onMonthChange: (month: string) => void;
  onDayClick: (iso: string) => void;
}) {
  const t = useTranslations('Tasks.calendar');
  const format = useFormatter();

  const grid = useMemo(() => monthGrid(month), [month]);
  const byDate = useMemo(() => tasksByDate(tasks), [tasks]);

  const num = (value: number) =>
    format.number(value, { numberingSystem: 'latn' });

  const title = format.dateTime(new Date(`${month}-01`), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  });

  // أسماء الأيام من أول أسبوع في الشبكة (السبت أولاً)
  const weekdays = grid
    .slice(0, 7)
    .map((iso) =>
      format.dateTime(new Date(iso), { weekday: 'long', timeZone: 'UTC' }),
    );

  return (
    <div className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ink text-base font-extrabold">{title}</h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            aria-label={t('prev')}
            className={cn(navBtn, 'w-9 px-0')}
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            className={cn(navBtn, 'px-4')}
            onClick={() => onMonthChange(today.slice(0, 7))}
          >
            {t('today')}
          </Button>
          <Button
            variant="outline"
            aria-label={t('next')}
            className={cn(navBtn, 'w-9 px-0')}
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="border-line min-w-[640px] overflow-hidden rounded-xl border">
          <div className="bg-line/70 grid grid-cols-7 gap-px">
            {weekdays.map((name) => (
              <div
                key={name}
                className="bg-neutral-soft/70 text-ink-2 px-2 py-2.5 text-center text-[11px] font-bold"
              >
                {name}
              </div>
            ))}

            {grid.map((iso) => {
              const inMonth = iso.startsWith(month);
              const isToday = iso === today;
              const dayTasks = byDate.get(iso) ?? [];
              const extra = dayTasks.length - MAX_CHIPS;

              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  aria-label={t('addOn', { date: iso })}
                  onClick={() => onDayClick(iso)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onDayClick(iso);
                    }
                  }}
                  className={cn(
                    'focus-visible:ring-brand/30 min-h-24 cursor-pointer p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-inset',
                    isToday
                      ? 'bg-brand-soft/60'
                      : inMonth
                        ? 'bg-surface hover:bg-canvas/60'
                        : 'bg-canvas/50 hover:bg-canvas',
                  )}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                        isToday
                          ? 'bg-brand text-white'
                          : inMonth
                            ? 'text-ink-2'
                            : 'text-muted/60',
                      )}
                    >
                      {num(Number(iso.slice(-2)))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, MAX_CHIPS).map((task) => (
                      <div
                        key={task.id}
                        title={task.title}
                        className={cn(
                          'truncate rounded-md px-1.5 py-1 text-start text-[10px] leading-tight font-semibold',
                          KIND[task.kind],
                          task.done && 'opacity-60 line-through',
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                    {extra > 0 && (
                      <p className="text-muted px-1 text-[10px] font-semibold">
                        {t('more', { count: num(extra) })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
