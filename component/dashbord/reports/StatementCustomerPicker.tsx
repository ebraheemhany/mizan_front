// component/dashbord/reports/StatementCustomerPicker.tsx
'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useCustomers, type CustomerListParams } from '@/lib/customers/hooks';
import { useMoney } from '@/lib/money';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';

/** Customers for the statement, largest balance first (also how the default one is picked). */
export const STATEMENT_CUSTOMERS: CustomerListParams = {
  status: 'all',
  balance: 'all',
  sort: 'balance',
  page: 1,
  pageSize: 50,
};

/** Picks the customer; the list is searched on the server once the user pauses typing. */
export default function StatementCustomerPicker({
  value,
  label,
  onChange,
}: {
  value: string | null;
  /** The chosen customer's name, when known. */
  label: string | null;
  onChange: (customer: { id: string; name: string }) => void;
}) {
  const t = useTranslations('ReportsApi');
  const money = useMoney();
  const errorMessage = useApiErrorMessage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const typed = query.trim();
  const debounced = useDebouncedValue(typed, 250);
  const list = useCustomers(
    { ...STATEMENT_CUSTOMERS, q: debounced.slice(0, 100) || undefined }, // the API's limit
    { enabled: open },
  );
  const items = list.data?.items ?? [];
  const searching = typed !== debounced || list.isFetching;

  function toggle(next: boolean) {
    setOpen(next);
    if (!next) setQuery('');
  }

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'rounded-btn border-line-strong bg-surface text-ink hover:border-brand/30 hover:bg-canvas focus-visible:ring-brand/30 h-10 w-full justify-between gap-2 border text-xs font-bold shadow-sm transition-colors focus-visible:ring-2 sm:w-64',
        )}
      >
        <span className={cn('truncate', !label && 'text-muted')}>{label ?? t('pickCustomer')}</span>
        <ChevronDown className="text-muted size-4 shrink-0" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line bg-surface w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border p-0 shadow-lg"
      >
        {/* Matching happens on the server (name, contact, phone, email). */}
        <Command shouldFilter={false} className="bg-surface rounded-xl p-1.5">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('searchCustomers')}
            className="text-ink placeholder:text-muted"
          />
          <CommandList className="max-h-64 py-1">
            <CommandEmpty className="text-muted py-5">
              {searching || list.isPending
                ? t('searching')
                : list.isError
                  ? errorMessage(list.error)
                  : t('noMatches')}
            </CommandEmpty>
            <CommandGroup>
              {items.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange({ id: c.id, name: c.name });
                    toggle(false);
                  }}
                  className="data-selected:bg-brand-soft data-selected:text-brand-deep rounded-lg px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                  <span className="text-muted text-xs tabular-nums">{money(Number(c.balance))}</span>
                  <Check className={cn('text-brand size-4', c.id === value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
