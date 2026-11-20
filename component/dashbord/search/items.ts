// component/dashbord/search/items.ts
import type { ApiCustomer } from '@/lib/customers/hooks';
import type { Expense } from '@/lib/mock/expenses';
import type { Quote } from '@/lib/quotes/hooks';
import type { Task } from '@/lib/tasks/hooks';

export type SearchGroup =
  | 'pages'
  | 'actions'
  | 'customers'
  | 'quotes'
  | 'tasks'
  | 'expenses';

export type SearchItem = {
  id: string;
  group: SearchGroup;
  label: string; // نص جاهز للعرض
  hint?: string;
  href: string;
};

export const PAGE_KEYS = [
  'dashboard',
  'customers',
  'deals',
  'quotes',
  'invoices',
  'expenses',
  'reports',
  'tasks',
] as const;

export const PAGE_HREF: Record<(typeof PAGE_KEYS)[number], string> = {
  dashboard: '/dashboard',
  customers: '/customers',
  deals: '/deals',
  quotes: '/quotes',
  invoices: '/invoices',
  expenses: '/expenses',
  reports: '/reports',
  tasks: '/tasks',
};

export const ACTION_KEYS = ['newInvoice', 'newQuote'] as const;

export const ACTION_HREF: Record<(typeof ACTION_KEYS)[number], string> = {
  newInvoice: '/invoices/new',
  newQuote: '/quotes/new',
};

// Customers and quotes are searched on the backend (customers: name, contact, phone,
// email; quotes: number or customer).
// TODO: invoices and deals could be added the same way.
export function dataItems(
  customers: ApiCustomer[],
  tasks: Task[],
  expenses: Expense[],
  quotes: Quote[] = [],
): SearchItem[] {
  return [
    ...customers.map((c) => ({
      id: `customer-${c.id}`,
      group: 'customers' as const,
      label: c.name,
      hint: [c.contactName, c.phone, c.email].filter(Boolean).join(' · ') || undefined,
      href: `/customers/${c.id}`,
    })),
    ...quotes.map((q) => ({
      id: `quote-${q.id}`,
      group: 'quotes' as const,
      label: q.displayNumber,
      hint: q.customer,
      href: `/quotes/${q.number}`,
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      group: 'tasks' as const,
      label: task.title,
      // The linked customer, so a task can also be found by its customer's name.
      hint: task.customer?.name,
      href: '/tasks',
    })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      group: 'expenses' as const,
      label: e.title,
      href: '/expenses',
    })),
  ];
}