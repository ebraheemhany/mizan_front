// component/dashbord/products/ProductsTable.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import type { CatalogItem } from '@/lib/mock/products';
import { stockLevel, type StockLevel } from './utils';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs';

const STOCK: Record<StockLevel, { box: string; dot: string }> = {
  ok: { box: 'bg-brand-soft text-brand-deep', dot: 'bg-brand' },
  low: { box: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  out: { box: 'bg-danger-soft text-danger', dot: 'bg-danger' },
};

export default function ProductsTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: CatalogItem[];
  /** Omitted when the user's role can't edit products: the menu item is hidden. */
  onEdit?: (item: CatalogItem) => void;
  /** Omitted when the user's role can't delete: the menu item is hidden. */
  onDelete?: (item: CatalogItem) => void;
}) {
  const t = useTranslations('Products');
  const format = useFormatter();
  const money = useMoney();

  const num = (v: number) => format.number(v, { numberingSystem: 'latn' });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse">
        <thead className="bg-neutral-soft/70">
          <tr>
            <th className={th}>{t('table.name')}</th>
            <th className={th}>{t('table.type')}</th>
            <th className={th}>{t('table.code')}</th>
            <th className={th}>{t('table.price')}</th>
            <th className={th}>{t('table.tax')}</th>
            <th className={th}>{t('table.stock')}</th>
            <th className={th}>{t('table.usage')}</th>
            <th className={th}>
              <span className="sr-only">{t('table.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const level = stockLevel(item);
            return (
              <tr key={item.id} className="border-line/70 border-t">
                <td className={cn(td, 'text-ink font-bold')}>{item.name}</td>
                <td className={td}>
                  <span className="bg-neutral-soft text-ink-2 rounded-md px-2 py-1 text-[11px] font-semibold">
                    {t(`types.${item.type}`)}
                  </span>
                </td>
                <td className={cn(td, 'text-ink-2 tabular-nums')} dir="ltr">
                  {item.code}
                </td>
                <td className={cn(td, 'text-ink font-bold tabular-nums')}>
                  {money(item.price)}
                </td>
                <td className={cn(td, 'text-ink-2 tabular-nums')}>
                  {format.number(item.taxRate / 100, {
                    style: 'percent',
                    maximumFractionDigits: 0,
                    numberingSystem: 'latn',
                  })}
                </td>
                <td className={td}>
                  {level ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                        STOCK[level].box,
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          STOCK[level].dot,
                        )}
                      />
                      {t(`stock.${level}`, { count: num(item.stock ?? 0) })}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className={cn(td, 'text-ink-2 tabular-nums')}>
                  {t('table.times', {
                    count: item.usageCount,
                    text: num(item.usageCount),
                  })}
                </td>
                <td className={td}>
                  {(onEdit || onDelete) && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      aria-label={t('table.actions')}
                      className="text-muted hover:bg-brand-soft hover:text-brand-deep focus-visible:ring-brand/30 flex size-9 items-center justify-center rounded-btn border border-transparent transition-colors outline-none focus-visible:ring-2"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-line bg-surface text-ink min-w-40 rounded-xl shadow-lg"
                    >
                      {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(item)}
                        className="rounded-lg px-3 py-2.5 text-xs font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        <Pencil className="text-muted size-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      )}
                      {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger rounded-lg px-3 py-2.5 text-xs font-semibold"
                      >
                        <Trash2 className="size-4" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
