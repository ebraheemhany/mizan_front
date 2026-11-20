// component/dashbord/tasks/TaskCustomerPicker.tsx
'use client';

import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
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
import { useCustomers } from '@/lib/customers/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';

export type PickedCustomer = { id: string; name: string };

/**
 * The (optional) customer a task is linked to. Customers are searched on the server once
 * the user pauses typing, and only while the list is open.
 */
export default function TaskCustomerPicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: PickedCustomer | null;
  onChange: (customer: PickedCustomer | null) => void;
}) {
  const t = useTranslations('TasksApi');
  const errorMessage = useApiErrorMessage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const typed = query.trim();
  const debounced = useDebouncedValue(typed, 250);
  const list = useCustomers(
    {
      q: debounced.slice(0, 100) || undefined, // the API's limit
      status: 'all',
      balance: 'all',
      sort: 'name',
      page: 1,
      pageSize: 50,
    },
    { enabled: open },
  );
  // While a new search is on its way the previous results are stale: show none, so Enter
  // can't pick a customer from the old list (cmdk highlights the first item).
  const stale = typed !== debounced || list.isPlaceholderData;
  const items = stale ? [] : (list.data?.items ?? []);
  const searching = stale || list.isFetching;

  function toggle(next: boolean) {
    setOpen(next);
    if (!next) setQuery('');
  }

  function pick(customer: PickedCustomer | null) {
    onChange(customer);
    toggle(false);
  }

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger
        id={id}
        className="rounded-btn border-line-strong bg-surface hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15 flex h-11 w-full items-center gap-3 border px-3 text-start text-xs shadow-sm transition-colors outline-none focus-visible:ring-2"
      >
        <span className={cn('min-w-0 flex-1 truncate', value ? 'text-ink font-semibold' : 'text-muted')}>
          {value ? value.name : t('customerNone')}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line bg-surface w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border p-0 shadow-lg"
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
                  onSelect={() => pick({ id: c.id, name: c.name })}
                  className="data-selected:bg-brand-soft data-selected:text-brand-deep rounded-lg px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.name}</span>
                    {(c.phone || c.city) && (
                      <span className="text-muted block truncate text-xs">{c.phone || c.city}</span>
                    )}
                  </span>
                  <Check className={cn('text-brand size-4', c.id === value?.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {value && (
            <div className="border-line border-t px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => pick(null)}
                className="text-ink-2 hover:bg-canvas hover:text-ink h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-xs font-bold"
              >
                <X className="size-4" />
                {t('customerClear')}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
