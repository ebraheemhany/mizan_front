// component/dashbord/search/CommandSearch.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { defaultFilter } from 'cmdk';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useRouter } from '@/i18n/navigation';
import {
  ACTION_HREF,
  ACTION_KEYS,
  dataItems,
  PAGE_HREF,
  PAGE_KEYS,
  type SearchGroup,
  type SearchItem,
} from './items';
import { useTasks } from '@/component/dashbord/AppDataProvider';
import { useCustomers } from '@/lib/customers/hooks';
import { useExpenses } from '@/lib/expenses/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';

const GROUP_ORDER: SearchGroup[] = [
  'pages',
  'actions',
  'customers',
  'tasks',
  'expenses',
];

// أقصى عدد نتايج في كل مجموعة علشان القائمة ما تطولش
const MAX_PER_GROUP = 6;

export default function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('Search');
  const router = useRouter();
  const { tasks } = useTasks();
  const { expenses } = useExpenses();
  // The typed text, so each group is filtered before it is capped: otherwise only the
  // first few items of a group could ever be found.
  const [query, setQuery] = useState('');
  // Customers are matched on the backend, once the user pauses typing, only while open.
  const typed = query.trim();
  const debouncedQuery = useDebouncedValue(typed, 250);
  const customersQuery = useCustomers(
    {
      q: debouncedQuery.slice(0, 100), // the API's limit
      status: 'all',
      balance: 'all',
      sort: 'recent',
      page: 1,
      pageSize: 20,
    },
    { enabled: open },
  );
  const customers = customersQuery.data?.items;
  const searching = open && (typed !== debouncedQuery || customersQuery.isFetching);

  const items = useMemo<SearchItem[]>(
    () => [
      ...PAGE_KEYS.map((key) => ({
        id: `page-${key}`,
        group: 'pages' as const,
        label: t(`pages.${key}`),
        href: PAGE_HREF[key],
      })),
      ...ACTION_KEYS.map((key) => ({
        id: `action-${key}`,
        group: 'actions' as const,
        label: t(`actions.${key}`),
        href: ACTION_HREF[key],
      })),
      ...dataItems(customers ?? [], tasks, expenses),
    ],
    [t, customers, tasks, expenses],
  );

  function setOpen(next: boolean) {
    if (!next) setQuery('');
    onOpenChange(next);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  // What a search is matched against: the label, the hint (a customer's contact, phone
  // and email, so one the server found by phone is not hidden) and the group name.
  const matchText = (item: SearchItem) =>
    [item.label, item.hint, t(`groups.${item.group}`)].filter(Boolean).join(' ');
  // cmdk's value must be unique, so it also carries the id.
  const valueOf = (item: SearchItem) => `${matchText(item)} ${item.id}`;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('title')}
      description={t('description')}
    >
      <CommandInput placeholder={t('placeholder')} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{searching ? t('searching') : t('empty')}</CommandEmpty>

        {GROUP_ORDER.map((group) => {
          const cap = MAX_PER_GROUP + (group === 'pages' ? 4 : 0);
          const inGroup = items.filter((i) => i.group === group);
          // Keep the best matches, not the first ones. Scored on matchText only (the id in
          // cmdk's value would let random letters match), with the text exactly as typed,
          // the way cmdk filters it.
          const list = !query
            ? inGroup.slice(0, cap)
            : inGroup
                .map((item) => ({ item, score: defaultFilter(matchText(item), query) }))
                .filter((m) => m.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, cap)
                .map((m) => m.item);
          if (list.length === 0) return null;

          return (
            <CommandGroup key={group} heading={t(`groups.${group}`)}>
              {list.map((item) => (
                <CommandItem
                  key={item.id}
                  // The value cmdk filters on: matchText + the id (unique).
                  value={valueOf(item)}
                  onSelect={() => go(item.href)}
                  className="text-ink data-selected:bg-brand-soft data-selected:text-brand-deep text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && (
                    <span className="text-muted max-w-[50%] shrink-0 truncate text-xs font-normal">
                      {item.hint}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
