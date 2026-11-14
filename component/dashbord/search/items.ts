// component/dashbord/search/items.ts
import { customerStatements } from '@/lib/mock/reports';
import type { Expense } from '@/lib/mock/expenses';
import type { Task } from '@/lib/mock/tasks';
export type SearchGroup =
  | 'pages'
  | 'actions'
  | 'customers'
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

// TODO: لما نربط الـ API البحث يبقى استعلام على الباك إند
// وتتضاف الفواتير والعروض والصفقات
export function dataItems(tasks: Task[], expenses: Expense[]): SearchItem[] {
  return [
    ...customerStatements.map((c) => ({
      id: `customer-${c.id}`,
      group: 'customers' as const,
      label: c.name,
      href: '/customers',
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      group: 'tasks' as const,
      label: task.title,
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