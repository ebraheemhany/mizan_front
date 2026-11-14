// component/dashbord/tasks/TasksView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { TASKS_TODAY, type Task } from '@/lib/mock/tasks';
import { useTasks } from '@/component/dashbord/AppDataProvider';
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
import type { TaskFormValues } from '@/lib/validations/tasks';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function TasksView() {
  const t = useTranslations('Tasks');
  const format = useFormatter();

  // TODO: لما نربط الـ API المهام دي بتيجي من الباك إند
  const { tasks, setTasks } = useTasks();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [month, setMonth] = useState(TASKS_TODAY.slice(0, 7));
  const stats = computeTaskStats(tasks, TASKS_TODAY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState(TASKS_TODAY);

  function openNew(date: string) {
    setSheetDate(date);
    setSheetOpen(true);
  }

  const tabs = useMemo(() => {
    const counts = countByFilter(tasks, TASKS_TODAY);
    return FILTER_KEYS.map((key) => ({
      value: key,
      label: t(`tabs.${key}`),
      count: counts[key],
    }));
  }, [t, tasks]);

  const visible = useMemo(
    () =>
      sortTasks(
        tasks.filter((task) => matchesFilter(task, filter, TASKS_TODAY)),
      ),
    [tasks, filter],
  );

  const num = (value: number) =>
    format.number(value, { numberingSystem: 'latn' });

  function toggleTask(prev: Task) {
    // TODO: PATCH /tasks/:id لما نربط الـ API
    const done = !prev.done;
    setTasks((list) =>
      list.map((x) =>
        x.id === prev.id
          ? { ...x, done, completedAt: done ? TASKS_TODAY : undefined }
          : x,
      ),
    );

    toast.success(
      t(done ? 'toasts.completed' : 'toasts.reopened', { title: prev.title }),
      {
        action: {
          label: t('toasts.undo'),
          onClick: () =>
            setTasks((list) => list.map((x) => (x.id === prev.id ? prev : x))),
        },
      },
    );
  }

  function addTask(values: TaskFormValues) {
    // TODO: POST /tasks لما نربط الـ API
    const task: Task = {
      id: `k${Date.now()}`,
      title: values.title.trim(),
      due: values.due,
      priority: values.priority,
      kind: values.kind,
      done: false,
      ...(values.linkType !== 'none'
        ? { link: { type: values.linkType, name: values.linkName.trim() } }
        : {}),
    };

    setTasks((list) => [task, ...list]);

    // نرجّع الفلتر وننقل التقويم لشهر المهمة علشان تظهر
    setFilter('all');
    setMonth(values.due.slice(0, 7));
    setSheetOpen(false);

    toast.success(t('toasts.added', { title: task.title }), {
      action: {
        label: t('toasts.undo'),
        onClick: () => setTasks((list) => list.filter((x) => x.id !== task.id)),
      },
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={`${t('summaryOpen', {
          count: stats.open,
          text: num(stats.open),
        })} · ${t('summaryOverdue', {
          count: stats.overdue,
          text: num(stats.overdue),
        })}`}
        actions={
          <Button className={primaryBtn} onClick={() => openNew(TASKS_TODAY)}>
            <Plus className="size-4" />
            {t('actions.new')}
          </Button>
        }
      />

      <FilterTabs value={filter} tabs={tabs} onChange={setFilter} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <TaskCalendar
          month={month}
          tasks={visible}
          today={TASKS_TODAY}
          onMonthChange={setMonth}
          onDayClick={openNew}
        />
        <TaskList tasks={visible} today={TASKS_TODAY} onToggle={toggleTask} />
      </div>
      <NewTaskSheet
        open={sheetOpen}
        defaultDate={sheetDate}
        onOpenChange={setSheetOpen}
        onSubmit={addTask}
      />
    </div>
  );
}
