// component/dashbord/notifications/utils.ts
// component/dashbord/notifications/utils.ts
import { agingRows } from '@/lib/mock/reports';
import type { Expense } from '@/lib/mock/expenses';
import { TASKS_TODAY, type Task } from '@/lib/mock/tasks';

export type NotificationKind =
  | 'receivableOverdue'
  | 'taskOverdue'
  | 'taskToday'
  | 'expenseDue';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string; // اسم المهمة أو المصروف أو العميل
  date?: string; // YYYY-MM-DD
  amount?: number;
  href: string;
};

// TODO: لما نربط الـ API الإشعارات تيجي من الباك إند
// وتتضاف "عرض سعر اتقبل" من العروض
export function buildNotifications(
  tasks: Task[],
  expenses: Expense[],
): AppNotification[] {
  const receivables = agingRows
    .map((r) => ({ r, overdue: r.d1_30 + r.d31_60 + r.d60plus }))
    .filter((x) => x.overdue > 0)
    .map(({ r, overdue }) => ({
      id: `receivable-${r.id}`,
      kind: 'receivableOverdue' as const,
      title: r.name,
      amount: overdue,
      href: '/reports',
    }));

  const overdueTasks = tasks
    .filter((t) => !t.done && t.due < TASKS_TODAY)
    .map((t) => ({
      id: `task-${t.id}`,
      kind: 'taskOverdue' as const,
      title: t.title,
      date: t.due,
      href: '/tasks',
    }));

  const todayTasks = tasks
    .filter((t) => !t.done && t.due === TASKS_TODAY)
    .map((t) => ({
      id: `task-${t.id}`,
      kind: 'taskToday' as const,
      title: t.title,
      date: t.due,
      href: '/tasks',
    }));

  const dueExpenses = expenses
    .filter((e) => e.status === 'due')
    .map((e) => ({
      id: `expense-${e.id}`,
      kind: 'expenseDue' as const,
      title: e.title,
      date: e.dueDate,
      amount: e.amount,
      href: '/expenses',
    }));

  return [...receivables, ...overdueTasks, ...todayTasks, ...dueExpenses];
}