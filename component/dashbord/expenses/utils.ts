// component/dashbord/expenses/utils.ts
import type { Expense, ExpenseCategory } from '@/lib/mock/expenses';

// YYYY-MM + عدد شهور (موجب أو سالب) = YYYY-MM
export function shiftMonth(ym: string, offset: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const sum = (list: Expense[]) => list.reduce((s, e) => s + e.amount, 0);

// مجموع كل تصنيف في الشهر، من الأكبر للأصغر (هنستخدمها في كارت "حسب التصنيف")
export function categoryTotals(expenses: Expense[], month: string) {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    if (!e.date.startsWith(month)) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([key, amount]) => ({ key, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeExpenseStats({
  expenses,
  month,
  prevMonth,
  revenue,
}: {
  expenses: Expense[];
  month: string;
  prevMonth: string;
  revenue: number;
}) {
  const total = sum(expenses.filter((e) => e.date.startsWith(month)));
  const prevTotal = sum(expenses.filter((e) => e.date.startsWith(prevMonth)));

  const top = categoryTotals(expenses, month)[0] ?? null;

  // المستحق: كل المصروفات اللي لسه ما اتدفعتش (مش مرتبط بالشهر)
  const dueItems = expenses.filter((e) => e.status === 'due');

  return {
    total,
    prevTotal,
    top: top
      ? { ...top, share: total > 0 ? top.amount / total : 0 }
      : null,
    dueAmount: sum(dueItems),
    dueVendors: new Set(dueItems.map((e) => e.vendor ?? e.id)).size,
    netProfit: revenue - total,
  };
}


// component/dashbord/expenses/utils.ts  (ضيف في الآخر)
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

export function applyFilters(
  expenses: Expense[],
  filters: Filters,
  month: string,
) {
  const q = filters.query.trim().toLowerCase();

  return expenses
    .filter((e) => {
      if (filters.category !== 'all' && e.category !== filters.category) {
        return false;
      }

      if (filters.period === 'thisMonth' && !e.date.startsWith(month)) {
        return false;
      }
      if (
        filters.period === 'lastMonth' &&
        !e.date.startsWith(shiftMonth(month, -1))
      ) {
        return false;
      }
      if (filters.period === 'thisYear' && !e.date.startsWith(month.slice(0, 4))) {
        return false;
      }

      if (q) {
        const haystack = `${e.title} ${e.vendor ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}


