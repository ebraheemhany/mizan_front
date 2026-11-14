// component/dashbord/expenses/ExpensesView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';

import Amount from '@/component/Amount';
import PageHeader from '@/component/PageHeader';

import StatCard from '@/component/StatCard';
import { Button } from '@/components/ui/button';
import { useMoney } from '@/lib/money';
import { monthRevenue, type Expense } from '@/lib/mock/expenses';
import { useExpenses } from '@/component/dashbord/AppDataProvider';
import { CURRENT_MONTH } from '@/lib/mock/reports';
import type { QuickExpenseValues } from '@/lib/validations/expenses';
import { changePct, monthToDate } from '../reports/utils';
import ExpensesTable from './ExpensesTable';
import ExpensesToolbar from './ExpensesToolbar';
import {
  applyFilters,
  computeExpenseStats,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  shiftMonth,
  categoryTotals,
  type Filters,
} from './utils';
import Pagination from '../Pagination';
import CategoryBreakdown from './CategoryBreakdown';
import QuickAddCard from './QuickAddCard';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

export default function ExpensesView() {
  const t = useTranslations('Expenses');
  const format = useFormatter();
  const money = useMoney();

  // TODO: لما نربط الـ API المصروفات دي بتيجي من الباك إند
  const { expenses, setExpenses } = useExpenses();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [requestedPage, setPage] = useState(1);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  function addExpense(values: QuickExpenseValues) {
    // TODO: POST /expenses لما نربط الـ API
    const expense: Expense = {
      id: `e${Date.now()}`,
      date: values.date,
      title: values.title.trim(),
      category: values.category,
      amount: Number(values.amount),
      status: 'paid',
    };

    setExpenses((list) => [expense, ...list]);

    // نرجّع الفلاتر علشان المصروف الجديد يظهر في الجدول
    setFilters({
      ...DEFAULT_FILTERS,
      period: values.date.startsWith(CURRENT_MONTH) ? 'thisMonth' : 'all',
    });
    setPage(1);

    toast.success(t('toasts.added', { title: expense.title }), {
      action: {
        label: t('toasts.undo'),
        onClick: () =>
          setExpenses((list) => list.filter((x) => x.id !== expense.id)),
      },
    });
  }

  const stats = computeExpenseStats({
    expenses,
    month: CURRENT_MONTH,
    prevMonth: shiftMonth(CURRENT_MONTH, -1),
    revenue: monthRevenue,
  });
  const totals = categoryTotals(expenses, CURRENT_MONTH);
  const rows = useMemo(
    () => applyFilters(expenses, filters, CURRENT_MONTH),
    [expenses, filters],
  );
  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pct = (value: number, signed = false) =>
    format.number(value / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
      ...(signed ? { signDisplay: 'always' as const } : {}),
    });

  const monthText = format.dateTime(monthToDate(CURRENT_MONTH), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  });

  const prevMonthName = format.dateTime(
    monthToDate(shiftMonth(CURRENT_MONTH, -1)),
    { month: 'long', timeZone: 'UTC' },
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('summary', {
          month: monthText,
          total: money(stats.total),
        })}
        actions={
          <>
            <Button
              variant="outline"
              className={outlineBtn}
              // TODO: تصدير CSV في الخطوة الجاية
              onClick={() => toast.info(t('toasts.soon'))}
            >
              <Download className="size-4" />
              {t('actions.export')}
            </Button>
            <Button
              className={primaryBtn}
              onClick={() => document.getElementById('qa-title')?.focus()}
            >
              <Plus className="size-4" />
              {t('actions.new')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('stats.total')}
          value={<Amount amount={stats.total} />}
          hint={t('stats.totalHint', {
            pct: pct(changePct(stats.total, stats.prevTotal), true),
            month: prevMonthName,
          })}
          tone="danger"
          hintTone="default"
        />
        <StatCard
          label={t('stats.topCategory')}
          value={stats.top ? t(`categories.${stats.top.key}`) : '—'}
          hint={
            stats.top
              ? t('stats.topCategoryHint', {
                  amount: money(stats.top.amount),
                  pct: pct(stats.top.share * 100),
                })
              : ''
          }
        />
        <StatCard
          label={t('stats.due')}
          value={<Amount amount={stats.dueAmount} />}
          hint={t('stats.dueHint', { count: stats.dueVendors })}
          tone="warning"
          hintTone="default"
        />
        <StatCard
          label={t('stats.netProfit')}
          value={<Amount amount={stats.netProfit} />}
          hint={t('stats.netProfitHint')}
          tone="brand"
          hintTone="default"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
          <ExpensesToolbar filters={filters} onChange={update} />

          {rows.length === 0 ? (
            <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
              {t('empty')}
            </div>
          ) : (
            <>
              <ExpensesTable rows={pageRows} />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={rows.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>

        <div className="space-y-4">
          <CategoryBreakdown totals={totals} />
          <QuickAddCard onAdd={addExpense} />
        </div>
      </div>
    </div>
  );
}
