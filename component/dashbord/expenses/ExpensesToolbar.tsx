// component/dashbord/expenses/ExpensesToolbar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, Search, Tag, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FilterPopover, { type Option } from '../FilterPopover';
import type { ExpenseCategory } from '@/lib/mock/expenses';
import type { CategoryFilter, Filters, PeriodFilter } from './utils';

const CATEGORIES: ExpenseCategory[] = [
  'salaries',
  'rent',
  'purchases',
  'marketing',
  'utilities',
  'software',
];

const PERIODS: PeriodFilter[] = ['thisMonth', 'lastMonth', 'thisYear', 'all'];

export default function ExpensesToolbar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  const t = useTranslations('Expenses');

  const categoryOptions: Option[] = [
    { value: 'all', label: t('toolbar.allCategories') },
    ...CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) })),
  ];

  const periodOptions: Option[] = PERIODS.map((p) => ({
    value: p,
    label: t(`periods.${p}`),
  }));

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.period !== 'thisMonth' ||
    filters.query !== '';

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t('toolbar.search')}
          aria-label={t('toolbar.search')}
          className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-10 pe-9 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPopover
          icon={Tag}
          label={t('toolbar.categoryLabel')}
          value={filters.category}
          allValue="all"
          options={categoryOptions}
          onChange={(category) =>
            onChange({ category: category as CategoryFilter })
          }
        />
        <FilterPopover
          icon={CalendarDays}
          label={t('toolbar.periodLabel')}
          value={filters.period}
          allValue="all"
          options={periodOptions}
          onChange={(period) =>
            onChange({ period: period as PeriodFilter })
          }
        />

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              onChange({ category: 'all', period: 'thisMonth', query: '' })
            }
            className="text-danger hover:bg-danger-soft hover:text-danger h-10 gap-1.5 px-3 text-xs font-bold"
          >
            <X className="size-3.5" />
            {t('toolbar.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
