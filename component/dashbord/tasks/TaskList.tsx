// component/dashbord/tasks/TaskList.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { addDaysIso } from '@/lib/iso-date';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/lib/tasks/hooks';
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
  busyIds,
}: {
  tasks: Task[];
  today: string;
  /** Left out for roles that may not change tasks: the checkboxes are then read-only. */
  onToggle?: (task: Task) => void;
  /** Tasks whose change is still being saved (their checkbox waits). */
  busyIds?: ReadonlySet<string>;
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
    if (task.done && task.completedOn) {
      return t('due.doneOn', { date: date(task.completedOn, false) });
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
            const busy = busyIds?.has(task.id) ?? false;

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
                  aria-busy={busy || undefined}
                  disabled={!onToggle || busy}
                  onClick={() => onToggle?.(task)}
                  className={cn(
                    'focus-visible:ring-brand/30 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-2 disabled:cursor-default',
                    task.done
                      ? 'border-brand bg-brand text-white'
                      : cn('border-line-strong bg-surface', onToggle && 'hover:border-brand'),
                    busy && 'opacity-60',
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
                    {task.customer && !task.done && (
                      <>
                        {' · '}
                        <Link
                          href={`/customers/${task.customer.id}`}
                          className="focus-visible:ring-brand/30 rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                        >
                          {t('links.customer', { name: task.customer.name })}
                        </Link>
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