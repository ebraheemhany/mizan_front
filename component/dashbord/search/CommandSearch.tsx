// component/dashbord/search/CommandSearch.tsx
'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

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
import { useExpenses, useTasks } from '@/component/dashbord/AppDataProvider';
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
      ...dataItems(tasks, expenses),
    ],
    [t, tasks, expenses],
  );

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
    >
      <CommandInput placeholder={t('placeholder')} />
      <CommandList>
        <CommandEmpty>{t('empty')}</CommandEmpty>

        {GROUP_ORDER.map((group) => {
          const list = items
            .filter((i) => i.group === group)
            .slice(0, MAX_PER_GROUP + (group === 'pages' ? 4 : 0));
          if (list.length === 0) return null;

          return (
            <CommandGroup key={group} heading={t(`groups.${group}`)}>
              {list.map((item) => (
                <CommandItem
                  key={item.id}
                  // القيمة اللي cmdk بيفلتر بيها: النص + اسم المجموعة
                  value={`${item.label} ${t(`groups.${group}`)} ${item.id}`}
                  onSelect={() => go(item.href)}
                  className="text-ink data-selected:bg-brand-soft data-selected:text-brand-deep text-sm"
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
