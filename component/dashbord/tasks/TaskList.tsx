// component/dashbord/tasks/TaskList.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { addDaysIso } from '@/lib/iso-date';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/lib/mock/tasks';
import { isOverdue } from './utils';

const BADGE: Record<TaskPriority | 'done', { box: string; dot: string }> = {
  urgent: { box: 'bg-danger-soft text-danger', dot: 'bg-danger' },
  important: { box: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  normal: { box: 'bg-neutral-soft text-ink-2', dot: 'bg-muted' },
  done: { box: 'bg-brand-soft text-brand-deep', dot: 'bg-brand' },
};

export default function TaskList({
  tasks,
  today,
  onToggle,
}: {
  tasks: Task[];
  today: string;
  onToggle: (task: Task) => void;
}) {
  const t = useTranslations('Tasks');
  const format = useFormatter();

  const date = (iso: string, withWeekday: boolean) =>
    format.dateTime(new Date(iso), {
      ...(withWeekday ? { weekday: 'long' as const } : {}),
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  function dueText(task: Task) {
    if (task.done && task.completedAt) {
      return t('due.doneOn', { date: date(task.completedAt, false) });
    }
    if (task.due === today) return t('due.today');
    if (task.due === addDaysIso(today, 1)) return t('due.tomorrow');
    return date(task.due, true);
  }

  return (
    <div className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{t('list.title')}</h2>

      {tasks.length === 0 ? (
        <p className="text-muted py-10 text-center text-xs">{t('list.empty')}</p>
      ) : (
        <ul className="mt-3">
          {tasks.map((task) => {
            const badge = BADGE[task.done ? 'done' : task.priority];
            const overdue = isOverdue(task, today);

            return (
              <li
                key={task.id}
                className="border-line/70 flex items-start gap-3 border-b py-3.5 last:border-b-0"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.done}
                  aria-label={task.title}
                  onClick={() => onToggle(task)}
                  className={cn(
                    'focus-visible:ring-brand/30 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-2',
                    task.done
                      ? 'border-brand bg-brand text-white'
                      : 'border-line-strong bg-surface hover:border-brand',
                  )}
                >
                  {task.done && <Check className="size-3.5" strokeWidth={3} />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-xs leading-5 font-bold',
                      task.done ? 'text-muted line-through' : 'text-ink',
                    )}
                  >
                    {task.title}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-[11px]',
                      overdue ? 'text-danger font-semibold' : 'text-muted',
                    )}
                  >
                    {dueText(task)}
                    {task.link && !task.done && (
                      <>
                        {' · '}
                        {t(`links.${task.link.type}`, { name: task.link.name })}
                      </>
                    )}
                  </p>
                </div>

                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                    badge.box,
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', badge.dot)} />
                  {task.done ? t('priorities.done') : t(`priorities.${task.priority}`)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}