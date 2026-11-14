// component/dashbord/payments/PaymentsToolbar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, CreditCard, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FilterPopover, { type Option } from '../FilterPopover';
import type { PaymentMethod } from '@/lib/mock/payments';
import type { Filters, MethodFilter, PeriodFilter } from './utils';

export const METHODS: PaymentMethod[] = [
  'bankTransfer',
  'cash',
  'instapay',
  'vodafoneCash',
  'cheque',
];

const PERIODS: PeriodFilter[] = ['thisMonth', 'lastMonth', 'thisYear', 'all'];

export default function PaymentsToolbar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  const t = useTranslations('Payments');

  const methodOptions: Option[] = [
    { value: 'all', label: t('toolbar.allMethods') },
    ...METHODS.map((m) => ({ value: m, label: t(`methods.${m}`) })),
  ];

  const periodOptions: Option[] = PERIODS.map((p) => ({
    value: p,
    label: t(`periods.${p}`),
  }));

  const hasActiveFilters =
    filters.method !== 'all' ||
    filters.period !== 'all' ||
    filters.query !== '';

  return (
    <div className="bg-canvas/30 flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full xl:max-w-md xl:flex-1">
        <Search className="text-muted pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t('toolbar.search')}
          aria-label={t('toolbar.search')}
          className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-11 ps-10 text-sm shadow-sm placeholder:text-muted"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        <FilterPopover
          icon={CreditCard}
          label={t('toolbar.methodLabel')}
          value={filters.method}
          allValue="all"
          options={methodOptions}
          onChange={(method) => onChange({ method: method as MethodFilter })}
        />
        <FilterPopover
          icon={CalendarDays}
          label={t('toolbar.periodLabel')}
          value={filters.period}
          allValue="all"
          options={periodOptions}
          onChange={(period) => onChange({ period: period as PeriodFilter })}
        />
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({ method: 'all', period: 'all', query: '' })
            }
            className="rounded-btn border-danger/20 bg-surface text-danger hover:border-danger/30 hover:bg-danger-soft hover:text-danger h-10 gap-1.5 px-3 text-xs font-bold shadow-sm"
          >
            <X className="size-4" />
            {t('toolbar.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
