// component/dashbord/expenses/ExpensesView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import Amount from '@/component/Amount';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { downloadCsv, type CsvColumn } from '@/lib/csv';
import {
  fetchExpensesForExport,
  openReceipt,
  receiptProblem,
  toUiExpense,
  useAddExpense,
  useAttachReceipt,
  useDeleteExpense,
  useRemoveReceipt,
  useExpenseList,
  useExpenseStats,
} from '@/lib/expenses/hooks';
import type { Expense } from '@/lib/mock/expenses';
import { useCurrency, useMoney } from '@/lib/money';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { QuickExpenseValues } from '@/lib/validations/expenses';
import Pagination from '../Pagination';
import { monthToDate } from '../reports/utils';
import CategoryBreakdown from './CategoryBreakdown';
import ExpensesTable from './ExpensesTable';
import ExpensesToolbar from './ExpensesToolbar';
import QuickAddCard from './QuickAddCard';
import { DEFAULT_FILTERS, PAGE_SIZE, shiftMonth, type Filters } from './utils';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

/** Expenses are for the roles with the "expenses" permission (owner + accountant). */
export default function ExpensesView() {
  const user = useSession();
  const tErrors = useTranslations('ApiErrors');
  if (!can(user.role, 'expenses')) {
    return <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>;
  }
  return <ExpensesContent />;
}

function ExpensesContent() {
  const t = useTranslations('Expenses');
  const tApi = useTranslations('ExpensesApi');
  const format = useFormatter();
  const money = useMoney();
  const currency = useCurrency();
  const errorMessage = useApiErrorMessage();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const query = useDebouncedValue(filters.query.trim(), 300);
  const listParams = { q: query || undefined, category: filters.category, period: filters.period };
  const listQuery = useExpenseList({ ...listParams, page, pageSize: PAGE_SIZE });
  const statsQuery = useExpenseStats();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const attachReceipt = useAttachReceipt();
  const removeReceipt = useRemoveReceipt();

  const receiptActions = {
    onView: (expense: Expense) => {
      openReceipt(expense.id).catch((error: unknown) => toast.error(errorMessage(error)));
    },
    onAttach: (expense: Expense, file: File) => {
      const problem = receiptProblem(file);
      if (problem) {
        toast.error(tApi(`receipts.${problem}`));
        return;
      }
      attachReceipt.mutate(
        { id: expense.id, file },
        {
          onSuccess: () => toast.success(tApi('receipts.attached', { title: expense.title })),
          onError: (error) => toast.error(errorMessage(error)),
        },
      );
    },
    onRemove: (expense: Expense) => {
      removeReceipt.mutate(expense.id, {
        onSuccess: () => toast.success(tApi('receipts.removed', { title: expense.title })),
        onError: (error) => toast.error(errorMessage(error)),
      });
    },
  };

  const data = listQuery.data;
  const rows = useMemo(() => data?.items.map(toUiExpense) ?? [], [data]);
  const lastPage = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : page;
  if (data && !listQuery.isPlaceholderData && page > lastPage) setPage(lastPage);

  // Stats numbers are shown only once they are known: no zeros while loading or after a failed
  // first load. A failed background refetch keeps the last good numbers on screen.
  const stats = statsQuery.data;
  const statsReady = stats !== undefined;
  // The business month comes from the server (Cairo date).
  const month = stats?.month ?? new Date().toISOString().slice(0, 7);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  async function add(values: QuickExpenseValues, receipt: File | null) {
    try {
      const expense = await addExpense.mutateAsync({
        title: values.title.trim(),
        amount: values.amount,
        category: values.category,
        date: values.date,
        paidFrom: values.paidFrom,
      });
      // The receipt goes up once the expense exists; if that fails the expense stays (attach it from the table).
      if (receipt) {
        try {
          await attachReceipt.mutateAsync({ id: expense.id, file: receipt });
        } catch (error) {
          toast.error(tApi('receipts.notAttached', { reason: errorMessage(error) }));
        }
      }
      // Show the new expense: this month's view if it belongs to it, otherwise everything.
      setFilters({ ...DEFAULT_FILTERS, period: values.date.startsWith(month) ? 'thisMonth' : 'all' });
      setPage(1);
      toast.success(t('toasts.added', { title: expense.title }), {
        action: {
          label: t('toasts.undo'),
          onClick: () => {
            deleteExpense.mutateAsync(expense.id).then(
              () => toast.success(tApi('removed', { title: expense.title })),
              (error: unknown) => toast.error(errorMessage(error)),
            );
          },
        },
      });
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function exportAll() {
    try {
      const items = await fetchExpensesForExport(listParams);
      if (items.length === 0) return;
      const columns: CsvColumn<Expense>[] = [
        { header: tApi('columns.date'), value: (e) => e.date },
        { header: tApi('columns.title'), value: (e) => e.title },
        { header: tApi('columns.category'), value: (e) => t(`categories.${e.category}`) },
        { header: tApi('columns.vendor'), value: (e) => e.vendor },
        { header: tApi('columns.paidFrom'), value: (e) => (e.paidFrom ? t(`sources.${e.paidFrom}`) : '') },
        { header: tApi('columns.amount'), value: (e) => e.amount },
        { header: tApi('columns.currency'), value: () => currency },
        { header: tApi('columns.status'), value: (e) => tApi(`statuses.${e.status}`) },
        { header: tApi('columns.dueDate'), value: (e) => e.dueDate },
      ];
      downloadCsv(`expenses-${new Date().toISOString().slice(0, 10)}.csv`, columns, items);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const pct = (value: number, signed = false) =>
    format.number(value / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
      ...(signed ? { signDisplay: 'always' as const } : {}),
    });

  const monthText = format.dateTime(monthToDate(month), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  });
  const prevMonthName = format.dateTime(monthToDate(shiftMonth(month, -1)), { month: 'long', timeZone: 'UTC' });
  const top = stats?.byCategory[0] ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={statsReady ? t('summary', { month: monthText, total: money(stats.total) }) : monthText}
        actions={
          <>
            <Button variant="outline" className={outlineBtn} disabled={!data?.total} onClick={exportAll}>
              <Download className="size-4" />
              {t('actions.export')}
            </Button>
            <Button className={primaryBtn} onClick={() => document.getElementById('qa-title')?.focus()}>
              <Plus className="size-4" />
              {t('actions.new')}
            </Button>
          </>
        }
      />

      {statsQuery.isError && !stats && (
        <div className="rounded-card border-line bg-surface flex flex-wrap items-center justify-between gap-3 border px-4 py-3 shadow-sm">
          <p className="text-danger text-sm font-semibold">{errorMessage(statsQuery.error)}</p>
          <Button variant="outline" className={outlineBtn} onClick={() => statsQuery.refetch()}>
            {tApi('retry')}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('stats.total')}
          value={statsReady ? <Amount amount={stats.total} /> : '—'}
          hint={
            !statsReady
              ? ''
              : stats.changePct === null
                ? tApi('noComparison')
                : t('stats.totalHint', { pct: pct(stats.changePct, true), month: prevMonthName })
          }
          tone="danger"
          hintTone="default"
        />
        <StatCard
          label={t('stats.topCategory')}
          value={top ? t(`categories.${top.key}`) : '—'}
          hint={top ? t('stats.topCategoryHint', { amount: money(top.amount), pct: pct(top.share) }) : ''}
        />
        <StatCard
          label={t('stats.due')}
          value={statsReady ? <Amount amount={stats.due} /> : '—'}
          hint={statsReady ? t('stats.dueHint', { count: stats.dueVendors }) : ''}
          tone="warning"
          hintTone="default"
        />
        <StatCard
          label={t('stats.netProfit')}
          value={statsReady ? <Amount amount={stats.netProfit} /> : '—'}
          hint={t('stats.netProfitHint')}
          tone="brand"
          hintTone="default"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
          <ExpensesToolbar filters={filters} onChange={update} />

          {listQuery.isPending ? (
            <div className="border-line text-muted flex justify-center border-t px-4 py-14">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : listQuery.isError && !data ? (
            <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
              <p className="text-danger text-sm font-semibold">{errorMessage(listQuery.error)}</p>
              <Button variant="outline" className={outlineBtn} onClick={() => listQuery.refetch()}>
                {tApi('retry')}
              </Button>
            </div>
          ) : data?.total === 0 ? (
            <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">{t('empty')}</div>
          ) : (
            <div className={listQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <ExpensesTable rows={rows} receipts={receiptActions} />
              <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CategoryBreakdown totals={stats?.byCategory ?? []} loading={!statsReady} />
          <QuickAddCard onAdd={add} />
        </div>
      </div>
    </div>
  );
}
