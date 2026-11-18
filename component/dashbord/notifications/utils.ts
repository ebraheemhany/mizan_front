// component/dashbord/notifications/utils.ts
import type { Expense } from '@/lib/mock/expenses';
import { TASKS_TODAY, type Task } from '@/lib/mock/tasks';
import type { OpenInvoiceRow } from '@/lib/payments/hooks';

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

/** Customers with overdue invoices, biggest overdue balance first. */
function overdueReceivables(openInvoices: OpenInvoiceRow[]): AppNotification[] {
  // Summed in cents so the total is exact (balances are 2-decimal amounts).
  const byCustomer = new Map<string, { name: string; cents: number }>();
  for (const invoice of openInvoices) {
    if (invoice.daysOverdue === null) continue;
    const row = byCustomer.get(invoice.customerId) ?? { name: invoice.customer, cents: 0 };
    row.cents += Math.round(invoice.balance * 100);
    byCustomer.set(invoice.customerId, row);
  }
  return [...byCustomer]
    .filter(([, row]) => row.cents > 0)
    .sort((a, b) => b[1].cents - a[1].cents)
    .map(([customerId, row]) => ({
      id: `receivable-${customerId}`,
      kind: 'receivableOverdue' as const,
      title: row.name,
      amount: row.cents / 100,
      href: `/customers/${customerId}`,
    }));
}

// TODO: tasks are still local data (tasks step); accepted quotes come with the quotes step.
export function buildNotifications(
  openInvoices: OpenInvoiceRow[],
  tasks: Task[],
  expenses: Expense[],
): AppNotification[] {
  const receivables = overdueReceivables(openInvoices);

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
