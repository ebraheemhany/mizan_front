// component/dashbord/tasks/TasksView.tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  useAddTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  type Task,
} from '@/lib/tasks/hooks';
import { cn } from '@/lib/utils';
import type { TaskFormValues } from '@/lib/validations/tasks';
import TaskList from './TaskList';
import {
  computeTaskStats,
  countByFilter,
  FILTER_KEYS,
  matchesFilter,
  sortTasks,
  type TaskFilter,
} from './utils';
import FilterTabs from '../FilterTabs';
import TaskCalendar from './TaskCalendar';
import NewTaskSheet from './NewTaskSheet';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';
const card = 'rounded-card border-line bg-surface border shadow-sm';

/** Everyone sees the tasks; only roles with the "tasks" permission add, complete or reopen them. */
export default function TasksView() {
  const t = useTranslations('Tasks');
  const tApi = useTranslations('TasksApi');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const canEdit = can(user.role, 'tasks');

  // `today` is the server's business date (Cairo), so "overdue" matches the backend.
  const { tasks, today, query } = useTasks();
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const loaded = query.data !== undefined;

  const [filter, setFilter] = useState<TaskFilter>('all');
  // null = today's month (follows `today` once the server's date is known).
  const [pickedMonth, setMonth] = useState<string | null>(null);
  const month = pickedMonth ?? today.slice(0, 7);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState(today);
  // Tasks whose done/undone change is still on its way (their checkbox waits).
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(() => new Set());
  const stats = computeTaskStats(tasks, today);

  function openNew(date: string) {
    setSheetDate(date);
    setSheetOpen(true);
  }

  const tabs = useMemo(() => {
    const counts = countByFilter(tasks, today);
    return FILTER_KEYS.map((key) => ({
      value: key,
      label: t(`tabs.${key}`),
      count: counts[key],
    }));
  }, [t, tasks, today]);

  const visible = useMemo(
    () => sortTasks(tasks.filter((task) => matchesFilter(task, filter, today))),
    [tasks, filter, today],
  );

  const num = (value: number) =>
    format.number(value, { numberingSystem: 'latn' });

  function setBusy(id: string, busy: boolean) {
    setBusyIds((ids) => {
      const next = new Set(ids);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // The same, read synchronously: a toast's "undo" can't start a second change on a task
  // whose first change is still saving (the replies could land in either order).
  const inFlight = useRef(new Set<string>());

  /**
   * PATCH done/undone (the list changes at once and goes back if it fails). Undoing a
   * reopen sends the day it was really done, so that day is kept.
   */
  async function saveDone(task: Task, done: boolean, completedOn?: string | null) {
    if (inFlight.current.has(task.id)) return false;
    inFlight.current.add(task.id);
    setBusy(task.id, true);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        patch: done && completedOn ? { done, completedOn } : { done },
      });
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      inFlight.current.delete(task.id);
      setBusy(task.id, false);
    }
  }

  async function toggleTask(prev: Task) {
    const done = !prev.done;
    if (!(await saveDone(prev, done))) return;

    toast.success(
      t(done ? 'toasts.completed' : 'toasts.reopened', { title: prev.title }),
      {
        action: {
          label: t('toasts.undo'),
          onClick: () => void saveDone(prev, prev.done, prev.completedOn),
        },
      },
    );
  }

  /** POST the task; false keeps the sheet open (the error is shown in a toast). */
  async function submitTask(values: TaskFormValues) {
    try {
      const task = await addTask.mutateAsync({
        title: values.title.trim(),
        due: values.due,
        priority: values.priority,
        kind: values.kind,
        customerId: values.customer?.id ?? null,
        dealId: values.deal?.id ?? null,
      });

      // نرجّع الفلتر وننقل التقويم لشهر المهمة علشان تظهر
      setFilter('all');
      setMonth(task.due.slice(0, 7));

      toast.success(t('toasts.added', { title: task.title }), {
        action: {
          label: t('toasts.undo'),
          // The creator may delete their own task.
          onClick: () => {
            deleteTask.mutateAsync(task.id).then(
              () => toast.success(tApi('removed', { title: task.title })),
              (error: unknown) => toast.error(errorMessage(error)),
            );
          },
        },
      });
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={
          loaded
            ? `${t('summaryOpen', {
                count: stats.open,
                text: num(stats.open),
              })} · ${t('summaryOverdue', {
                count: stats.overdue,
                text: num(stats.overdue),
              })}`
            : undefined
        }
        actions={
          canEdit ? (
            <Button className={primaryBtn} onClick={() => openNew(today)}>
              <Plus className="size-4" />
              {t('actions.new')}
            </Button>
          ) : undefined
        }
      />

      {loaded ? (
        <>
          <FilterTabs value={filter} tabs={tabs} onChange={setFilter} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
            <TaskCalendar
              month={month}
              tasks={visible}
              today={today}
              onMonthChange={setMonth}
              onDayClick={canEdit ? openNew : undefined}
            />
            <TaskList
              tasks={visible}
              today={today}
              onToggle={canEdit ? toggleTask : undefined}
              busyIds={busyIds}
            />
          </div>
        </>
      ) : query.isError ? (
        <div className={cn(card, 'flex flex-col items-center gap-3 px-4 py-14 text-center')}>
          <p className="text-danger text-sm font-semibold">{errorMessage(query.error)}</p>
          <Button
            variant="outline"
            className={outlineBtn}
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching && <Loader2 className="size-4 animate-spin" />}
            {tApi('retry')}
          </Button>
        </div>
      ) : (
        <div
          role="status"
          aria-label={tApi('loading')}
          className={cn(card, 'text-muted flex justify-center px-4 py-14')}
        >
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {canEdit && (
        <NewTaskSheet
          open={sheetOpen}
          defaultDate={sheetDate}
          onOpenChange={setSheetOpen}
          onSubmit={submitTask}
        />
      )}
    </div>
  );
}
