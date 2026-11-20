// component/dashbord/tasks/utils.ts
import { addDaysIso } from '@/lib/iso-date';
import type { Task } from '@/lib/tasks/hooks';

export type TaskFilter = 'all' | 'today' | 'week' | 'overdue' | 'done';

export const FILTER_KEYS: TaskFilter[] = [
  'all',
  'today',
  'week',
  'overdue',
  'done',
];

const SATURDAY = 6;

// الأسبوع من السبت للجمعة، زي التقويم
export function weekRange(today: string) {
  const day = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = الأحد
  const offset = (day - SATURDAY + 7) % 7;
  const start = addDaysIso(today, -offset);
  return { start, end: addDaysIso(start, 6) };
}

export function isOverdue(task: Task, today: string) {
  return !task.done && task.due < today;
}

// "Today", "this week" and "overdue" are what is still to do; finished tasks are under "done".
export function matchesFilter(task: Task, filter: TaskFilter, today: string) {
  switch (filter) {
    case 'all':
      return true;
    case 'today':
      return !task.done && task.due === today;
    case 'week': {
      const { start, end } = weekRange(today);
      return !task.done && task.due >= start && task.due <= end;
    }
    case 'overdue':
      return isOverdue(task, today);
    case 'done':
      return task.done;
  }
}

export function countByFilter(tasks: Task[], today: string) {
  return Object.fromEntries(
    FILTER_KEYS.map((key) => [
      key,
      tasks.filter((t) => matchesFilter(t, key, today)).length,
    ]),
  ) as Record<TaskFilter, number>;
}

export function computeTaskStats(tasks: Task[], today: string) {
  const overdue = tasks.filter((t) => isOverdue(t, today)).length;
  const open = tasks.filter((t) => !t.done && !isOverdue(t, today)).length;
  return { open, overdue };
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.due.localeCompare(b.due);
  });
}



// 42 خانة (6 أسابيع) تبدأ من السبت اللي قبل أول الشهر أو يوافقه
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const day = new Date(`${first}T00:00:00Z`).getUTCDay();
  const offset = (day - SATURDAY + 7) % 7;
  const start = addDaysIso(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDaysIso(start, i));
}

// YYYY-MM + عدد شهور (موجب أو سالب) = YYYY-MM
export function shiftMonth(ym: string, offset: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// المهام متجمّعة بتاريخ الاستحقاق، والمفتوحة قبل المكتملة جوه اليوم
export function tasksByDate(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  for (const task of sortTasks(tasks)) {
    const list = map.get(task.due) ?? [];
    list.push(task);
    map.set(task.due, list);
  }
  return map;
}


