// lib/tasks/hooks.ts
// Tasks API (backend /api/tasks) as TanStack Query hooks, plus the Task shape the
// tasks page, the notifications bell, the command search and the sidebar use.
'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { deviceCairoToday, msUntilCairoMidnight } from '@/lib/iso-date';
import { queryKeys } from '@/lib/query/keys';

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type TaskPriority = 'urgent' | 'important' | 'normal';

/** The kind picks the chip colour in the calendar. */
export type TaskKind = 'meeting' | 'quote' | 'collection' | 'visit' | 'deadline' | 'admin';

export type ApiTask = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  due: string;
  priority: TaskPriority;
  kind: TaskKind;
  done: boolean;
  /** YYYY-MM-DD, set when the task was marked done. */
  completedOn: string | null;
  customer: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  createdBy: { id: string; fullName: string } | null;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  due: string;
  priority: TaskPriority;
  kind: TaskKind;
  done: boolean;
  /** YYYY-MM-DD, or null while the task is open. */
  completedOn: string | null;
  customer: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  createdBy: { id: string; fullName: string } | null;
};

export type NewTask = {
  title: string;
  due: string;
  priority: TaskPriority;
  kind: TaskKind;
  customerId: string | null;
  /** A deal; with no customer given, the server uses the deal's customer. */
  dealId?: string | null;
};

/**
 * Any non-empty subset; `done` true/false completes/reopens the task. `completedOn` (with
 * done: true) puts back the day it was really done, for "undo" after reopening it.
 */
export type TaskPatch = Partial<NewTask & { done: boolean; completedOn: string }>;

/** What is cached: the tasks plus the server's business date (Cairo). */
type TasksData = { today: string; tasks: Task[] };

export function toUiTask(t: ApiTask): Task {
  return {
    id: t.id,
    title: t.title,
    // Dates are compared as text against `today`: keep only the YYYY-MM-DD part.
    due: t.due.slice(0, 10),
    priority: t.priority,
    kind: t.kind,
    done: t.done,
    completedOn: t.completedOn ? t.completedOn.slice(0, 10) : null,
    customer: t.customer,
    deal: t.deal ?? null,
    createdBy: t.createdBy,
  };
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

const NO_TASKS: Task[] = [];

/**
 * Every open task of the company plus those completed in the last 60 days (any role may
 * read them). `today` is the server's business date; until it loads, today in Cairo by
 * this device's clock.
 */
export function useTasks() {
  const [deviceToday] = useState(deviceCairoToday);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.tasks.list,
    queryFn: async (): Promise<TasksData> => {
      const { today, items } = await api<{ today: string; items: ApiTask[] }>('/api/tasks');
      return { today, tasks: items.map(toUiTask) };
    },
    staleTime: 60_000,
  });

  // A page left open overnight: refetch just after midnight in Cairo, so "today",
  // "overdue" and the calendar move to the new day (the server sends the new date).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        schedule();
      }, msUntilCairoMidnight());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [queryClient]);
  return {
    tasks: query.data?.tasks ?? NO_TASKS,
    today: query.data?.today ?? deviceToday,
    query,
  };
}

// ---------------------------------------------------------------------------
// Mutations: each one updates the cached list right away, then refetches it.
// ---------------------------------------------------------------------------

// Shared by every task mutation, so a refetch waits for the last one in flight.
const TASK_MUTATION = queryKeys.tasks.all;

function useTasksCache() {
  const queryClient = useQueryClient();

  const update = (change: (tasks: Task[]) => Task[]) =>
    queryClient.setQueryData<TasksData>(queryKeys.tasks.list, (data) =>
      data ? { ...data, tasks: change(data.tasks) } : data,
    );

  // Only refetch once the last task change is done: a refetch that starts while another
  // change is still on its way would bring back the old state and undo it on screen.
  const refetchWhenIdle = () => {
    if (queryClient.isMutating({ mutationKey: TASK_MUTATION }) === 1) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      // Deals show how many open tasks they have.
      void queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    }
  };

  return { queryClient, update, refetchWhenIdle };
}

const replaceTask = (task: Task) => (tasks: Task[]) => tasks.map((t) => (t.id === task.id ? task : t));

export function useAddTask() {
  const { update, refetchWhenIdle } = useTasksCache();
  return useMutation({
    mutationKey: TASK_MUTATION,
    mutationFn: async (input: NewTask) =>
      toUiTask((await api<{ task: ApiTask }>('/api/tasks', { method: 'POST', body: input })).task),
    // Shown at once, before the refetch.
    onSuccess: (task) => update((tasks) => [task, ...tasks.filter((t) => t.id !== task.id)]),
    onSettled: refetchWhenIdle,
  });
}

export function useUpdateTask() {
  const { queryClient, update, refetchWhenIdle } = useTasksCache();
  return useMutation({
    mutationKey: TASK_MUTATION,
    mutationFn: async ({ id, patch }: { id: string; patch: TaskPatch }) =>
      toUiTask((await api<{ task: ApiTask }>(`/api/tasks/${id}`, { method: 'PATCH', body: patch })).task),

    // Optimistic: the list shows the change before the server answers.
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const data = queryClient.getQueryData<TasksData>(queryKeys.tasks.list);
      const before = data?.tasks.find((t) => t.id === id);
      if (!data || !before) return { before: undefined };

      const { customerId, dealId, done, completedOn, ...fields } = patch;
      const after: Task = {
        ...before,
        ...fields,
        // A newly linked customer's name is only known once the server answers.
        customer: customerId === null ? null : before.customer,
        deal: dealId === null ? null : before.deal,
        done: done ?? before.done,
        completedOn:
          done === undefined ? before.completedOn : done ? (completedOn ?? before.completedOn ?? data.today) : null,
      };
      update(replaceTask(after));
      return { before };
    },
    // Put back only this task (other tasks may have changed meanwhile).
    onError: (_error, _vars, result) => {
      if (result?.before) update(replaceTask(result.before));
    },
    onSuccess: (task) => update(replaceTask(task)),
    onSettled: refetchWhenIdle,
  });
}

/** Allowed for the owner and for whoever created the task (others get FORBIDDEN). */
export function useDeleteTask() {
  const { update, refetchWhenIdle } = useTasksCache();
  return useMutation({
    mutationKey: TASK_MUTATION,
    mutationFn: async (id: string) => {
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      return id;
    },
    onSuccess: (id) => update((tasks) => tasks.filter((t) => t.id !== id)),
    onSettled: refetchWhenIdle,
  });
}
