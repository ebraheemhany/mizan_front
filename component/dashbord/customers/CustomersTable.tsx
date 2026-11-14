// components/customers/CustomersTable.tsx
'use client';

import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMoney } from '@/lib/money';
import { formatDaysAgo } from '@/lib/relative-time';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/mock/customers';
import StatusBadge from './StatusBadge';
import { Link, useRouter } from '@/i18n/navigation';
// السطرين بيغطوا نسخ شادسن اللي بتستخدم data-state والنسخ اللي بتستخدم data-checked
const checkboxClass =
  'data-[state=checked]:border-brand data-[state=checked]:bg-brand data-checked:border-brand data-checked:bg-brand';

const AVATAR_STYLES = [
  'bg-brand-soft text-brand-deep',
  'bg-amber-100 text-amber-800',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
];

function avatarStyle(id: string) {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_STYLES[sum % AVATAR_STYLES.length];
}

// الحرف الأول من آخر كلمة في الاسم بعد حذف "ال" ("شركة النيل" ← ن)
function initial(name: string) {
  const words = name.trim().split(/\s+/);
  const last = words[words.length - 1].replace(/^ال/, '');
  return last.charAt(0) || name.charAt(0);
}

export default function CustomersTable({
  rows,
  selected,
  allSelected,
  onToggleRow,
  onTogglePage,
  onEdit,
  onDelete,
}: {
  rows: Customer[];
  selected: Set<string>;
  allSelected: boolean;
  onToggleRow: (id: string) => void;
  onTogglePage: (checked: boolean) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}) {
  const t = useTranslations('Customers');
  const locale = useLocale();
  const money = useMoney();
  const router = useRouter();
  const th =
    'px-4 py-3 text-start text-xs font-bold text-muted whitespace-nowrap';

  return (
    <div className="border-line overflow-x-auto border-t">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-canvas/60">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onTogglePage(checked === true)}
                aria-label={t('selectAll')}
                className={checkboxClass}
              />
            </th>
            <th className={th}>{t('columns.customer')}</th>
            <th className={th}>{t('columns.contact')}</th>
            <th className={th}>{t('columns.balance')}</th>
            <th className={th}>{t('columns.lastActivity')}</th>
            <th className={th}>{t('columns.status')}</th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>

        <tbody>
          {rows.map((c) => {
            const isSelected = selected.has(c.id);
            return (
              <tr
                key={c.id}
                data-selected={isSelected}
                className={cn(
                  'border-line border-t transition-colors',
                  isSelected ? 'bg-brand-soft/60' : 'hover:bg-canvas/50',
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleRow(c.id)}
                    aria-label={t('selectRow', { name: c.name })}
                    className={checkboxClass}
                  />
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold',
                        avatarStyle(c.id),
                      )}
                    >
                      {initial(c.name)}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-ink block truncate font-bold hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-muted text-xs">{c.city}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <p className="text-ink-2 font-semibold">{c.contact}</p>
                  <p className="text-muted text-xs tabular-nums">{c.phone}</p>
                </td>

                <td
                  className={cn(
                    'px-4 py-3 font-bold whitespace-nowrap tabular-nums',
                    c.balance === 0
                      ? 'text-muted'
                      : c.status === 'overdue'
                        ? 'text-danger'
                        : 'text-ink',
                  )}
                >
                  {money(c.balance)}
                </td>

                <td className="text-body px-4 py-3 whitespace-nowrap">
                  {formatDaysAgo(locale, c.lastActivityDaysAgo)}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>

                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={t('actions.open')}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'size-8',
                      )}
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-line bg-surface text-ink shadow-float rounded-card min-w-48 p-1.5"
                    >
                      <DropdownMenuItem
                        onClick={() => router.push(`/customers/${c.id}`)}
                        className="rounded-btn text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 px-3 py-2 font-semibold"
                      >
                        <Eye className="text-muted size-4" aria-hidden="true" />
                        {t('actions.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(c)}
                        className="rounded-btn text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 px-3 py-2 font-semibold"
                      >
                        <Pencil
                          className="text-muted size-4"
                          aria-hidden="true"
                        />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(c)}
                        className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger rounded-btn min-h-10 px-3 py-2 font-semibold"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
