// component/dashbord/expenses/utils.ts
import type { ExpenseCategory } from '@/lib/mock/expenses';

// YYYY-MM + عدد شهور (موجب أو سالب) = YYYY-MM
export function shiftMonth(ym: string, offset: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Filtering, paging, totals and the category breakdown come from the backend (/api/expenses).
export const PAGE_SIZE = 6;

export type PeriodFilter = 'thisMonth' | 'lastMonth' | 'thisYear' | 'all';
export type CategoryFilter = ExpenseCategory | 'all';

export type Filters = {
  query: string;
  category: CategoryFilter;
  period: PeriodFilter;
};

export const DEFAULT_FILTERS: Filters = {
  query: '',
  category: 'all',
  period: 'thisMonth',
};
