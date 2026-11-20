// component/dashbord/notifications/utils.ts
import type { Expense } from '@/lib/mock/expenses';
import type { OpenInvoiceRow } from '@/lib/payments/hooks';
import type { Quote } from '@/lib/quotes/hooks';
import type { Task } from '@/lib/tasks/hooks';

export type NotificationKind =
  | 'receivableOverdue'
  | 'taskOverdue'
  | 'taskToday'
  | 'expenseDue'
  | 'quoteAccepted';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string; // اسم المهمة أو المصروف أو العميل
  date?: string; // YYYY-MM-DD
  amount?: number;
  /** A document's number as shown (e.g. an accepted quote's Q-0212). */
  ref?: string;
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

/**
 * `today` is the server's business date (YYYY-MM-DD), the one tasks are due against.
 * `acceptedQuotes`: accepted quotes (only fetched for roles that may issue invoices); the
 * ones not converted yet ask to be turned into an invoice.
 */
export function buildNotifications(
  openInvoices: OpenInvoiceRow[],
  tasks: Task[],
  today: string,
  expenses: Expense[],
  acceptedQuotes: Quote[] = [],
): AppNotification[] {
  const receivables = overdueReceivables(openInvoices);

  const overdueTasks = tasks
    .filter((t) => !t.done && t.due < today)
    .map((t) => ({
      id: `task-${t.id}`,
      kind: 'taskOverdue' as const,
      title: t.title,
      date: t.due,
      href: '/tasks',
    }));

  const todayTasks = tasks
    .filter((t) => !t.done && t.due === today)
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

  const toConvert = acceptedQuotes
    .filter((q) => q.status === 'accepted' && !q.invoice)
    .map((q) => ({
      id: `quote-${q.id}`,
      kind: 'quoteAccepted' as const,
      title: q.customer,
      amount: q.total,
      ref: q.displayNumber,
      href: `/invoices/new?fromQuote=${q.number}`,
    }));

  return [...receivables, ...toConvert, ...overdueTasks, ...todayTasks, ...dueExpenses];
}
