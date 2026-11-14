// component/dashbord/products/ProductsToolbar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Search, Tag, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FilterPopover, { type Option } from '../FilterPopover';
import type { ItemCategory } from '@/lib/mock/products';
import type { CategoryFilter, Filters } from './utils';

export const CATEGORIES: ItemCategory[] = [
  'software',
  'support',
  'consulting',
  'devices',
  'network',
  'accessories',
];

export default function ProductsToolbar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  const t = useTranslations('Products');

  const options: Option[] = [
    { value: 'all', label: t('toolbar.allCategories') },
    ...CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) })),
  ];

  const hasActiveFilters =
    filters.category !== 'all' || filters.query !== '';

  return (
    <div className="bg-canvas/30 flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t('toolbar.search')}
          aria-label={t('toolbar.search')}
          className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-10 ps-10 text-sm shadow-sm placeholder:text-muted"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPopover
          icon={Tag}
          label={t('toolbar.categoryLabel')}
          value={filters.category}
          allValue="all"
          options={options}
          onChange={(category) =>
            onChange({ category: category as CategoryFilter })
          }
        />
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ category: 'all', query: '' })}
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
