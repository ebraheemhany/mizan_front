// components/quotes/QuotesToolbar.tsx
'use client';

import { CalendarDays, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Filters, Period } from './utils';
import FilterPopover, { type Option } from '../FilterPopover';

export default function QuotesToolbar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  const t = useTranslations('Quotes');

  const periodOptions: Option[] = (
    ['all', 'month', 'lastMonth', 'year'] as const
  ).map((key) => ({
    value: key,
    label: t(`filters.period.${key}`),
  }));

  const hasActive = filters.period !== 'all' || filters.query !== '';

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t('search')}
          aria-label={t('search')}
          className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-10 pe-9 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPopover
          icon={CalendarDays}
          value={filters.period}
          options={periodOptions}
          onChange={(period) => onChange({ period: period as Period })}
        />

        {hasActive && (
          <Button
            variant="ghost"
            onClick={() => onChange({ period: 'all', query: '' })}
            className="text-danger hover:bg-danger-soft hover:text-danger h-10 gap-1.5 px-3 text-xs font-bold"
          >
            <X className="size-3.5" />
            {t('filters.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
