// components/invoices/InvoicesToolbar.tsx
'use client';

import {
  ArrowUpDown,
  CalendarDays,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Filters, Period, Sort } from './utils';
import FilterPopover, { type Option } from '../FilterPopover';

export default function InvoicesToolbar({
  filters,
  customers,
  onChange,
}: {
  filters: Filters;
  /** Customers to filter by (id + name), from the customers API. */
  customers: { id: string; name: string }[];
  onChange: (patch: Partial<Filters>) => void;
}) {
  const t = useTranslations('Invoices');

  const customerOptions: Option[] = [
    { value: 'all', label: t('filters.customerAll') },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const periodOptions: Option[] = (
    ['all', 'month', 'lastMonth', 'year'] as const
  ).map((key) => ({
    value: key,
    label: t(`filters.period.${key}`),
  }));

  const sortOptions: Option[] = (
    ['recent', 'oldest', 'amount', 'due'] as const
  ).map((key) => ({
    value: key,
    label: t(`filters.sort.${key}`),
  }));

  const hasActive =
    filters.customer !== 'all' ||
    filters.period !== 'all' ||
    filters.query !== '';

  return (
    <div className="bg-canvas/30 flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full xl:max-w-md xl:flex-1">
        <Search className="text-muted pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t('search')}
          aria-label={t('search')}
          className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-11 ps-10 text-sm shadow-sm placeholder:text-muted"
        />
        {filters.query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('filters.clear')}
            onClick={() => onChange({ query: '' })}
            className="text-muted hover:text-ink absolute end-1.5 top-1/2 size-8 -translate-y-1/2"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        <FilterPopover
          icon={Users}
          label={t('filters.customer')}
          value={filters.customer}
          allValue="all"
          options={customerOptions}
          onChange={(customer) => onChange({ customer })}
          searchPlaceholder={t('filters.customerSearch')}
          emptyText={t('filters.customerEmpty')}
        />

        <FilterPopover
          icon={CalendarDays}
          label={t('filters.periodLabel')}
          value={filters.period}
          allValue="all"
          options={periodOptions}
          onChange={(period) => onChange({ period: period as Period })}
        />

        <FilterPopover
          icon={ArrowUpDown}
          label={t('filters.sortLabel')}
          value={filters.sort}
          options={sortOptions}
          onChange={(sort) => onChange({ sort: sort as Sort })}
        />

        {hasActive && (
          <Button
            variant="outline"
            onClick={() =>
              onChange({ customer: 'all', period: 'all', query: '' })
            }
            className="rounded-btn border-danger/20 bg-surface text-danger hover:border-danger/30 hover:bg-danger-soft hover:text-danger h-10 gap-1.5 px-3 text-xs font-bold shadow-sm"
          >
            <X className="size-4" />
            {t('filters.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
