// components/customers/CustomersToolbar.tsx
'use client';

import { ArrowUpDown, Search, UserRound, WalletCards, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Owner } from '@/lib/mock/customers';
import FilterPopover, { type Option } from '../FilterPopover';
import type { Filters } from './utils';

export default function CustomersToolbar({
  filters,
  owners,
  onChange,
}: {
  filters: Filters;
  /** Team members, for the "responsible" filter. */
  owners: Owner[];
  onChange: (patch: Partial<Filters>) => void;
}) {
  const t = useTranslations('Customers');

  const ownerOptions: Option[] = [
    { value: 'all', label: t('filters.ownerAll') },
    ...owners.map((o) => ({ value: o.id, label: o.name })),
  ];

  const balanceOptions: Option[] = [
    { value: 'all', label: t('filters.balanceAll') },
    { value: 'due', label: t('filters.balanceDue') },
    { value: 'zero', label: t('filters.balanceZero') },
  ];

  const sortOptions: Option[] = (
    ['recent', 'oldest', 'balance', 'name'] as const
  ).map((key) => ({
    value: key,
    label: t(`filters.sort.${key}`),
  }));

  const hasActive =
    filters.owner !== 'all' ||
    filters.balance !== 'all' ||
    filters.query !== '';

  return (
    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="text-muted pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2" />
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
          icon={UserRound}
          label={t('filters.owner')}
          value={filters.owner}
          allValue="all"
          options={ownerOptions}
          onChange={(owner) => onChange({ owner })}
          searchPlaceholder={t('filters.ownerSearch')}
          emptyText={t('filters.ownerEmpty')}
        />
        <FilterPopover
          icon={WalletCards}
          label={t('filters.balance')}
          value={filters.balance}
          allValue="all"
          options={balanceOptions}
          onChange={(balance) =>
            onChange({ balance: balance as Filters['balance'] })
          }
        />
        <FilterPopover
          icon={ArrowUpDown}
          value={filters.sort}
          options={sortOptions}
          onChange={(sort) => onChange({ sort: sort as Filters['sort'] })}
        />

        {hasActive && (
          <Button
            variant="ghost"
            onClick={() =>
              onChange({ owner: 'all', balance: 'all', query: '' })
            }
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
