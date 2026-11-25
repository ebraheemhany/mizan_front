// components/invoices/InvoicesTable.tsx
'use client';

import { Ban, CreditCard, Download, Eye, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { checkboxClass, thClass } from '@/component/table-styles';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useRouter } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import { invoiceLabel } from '@/lib/invoices/hooks';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/mock/invoices';
import StatusBadge from './StatusBadge';
import { canCancel, canRecordPayment } from './utils';

export default function InvoicesTable({
  rows,
  selected,
  allSelected,
  onToggleRow,
  onToggleAll,
  onDownload,
  onRecordPayment,
  onCancel,
}: {
  rows: Invoice[];
  selected: Set<string>;
  allSelected: boolean;
  onToggleRow: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onDownload: (number: number) => void;
  /** Omitted when the user's role can't record payments: the item is hidden. */
  onRecordPayment?: (invoice: Invoice) => void;
  /** Omitted when the user's role can't cancel invoices: the item is hidden. */
  onCancel?: (invoice: Invoice) => void;
}) {
  const t = useTranslations('Invoices');
  const router = useRouter();
  const money = useMoney();
  const date = useDate();

  return (
    <div className="border-line overflow-x-auto border-t">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-canvas/60">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label={t('selectAll')}
                className={checkboxClass}
              />
            </th>
            <th className={thClass}>{t('columns.number')}</th>
            <th className={thClass}>{t('columns.customer')}</th>
            <th className={thClass}>{t('columns.issueDate')}</th>
            <th className={thClass}>{t('columns.dueDate')}</th>
            <th className={thClass}>{t('columns.total')}</th>
            <th className={thClass}>{t('columns.remaining')}</th>
            <th className={thClass}>{t('columns.status')}</th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>

        <tbody>
          {rows.map((inv) => {
            const isSelected = selected.has(inv.id);
            const overdue = inv.status === 'overdue';

            return (
              <tr
                key={inv.id}
                className={cn(
                  'border-line border-t transition-colors',
                  isSelected
                    ? 'bg-brand-soft/60'
                    : overdue
                      ? 'bg-danger-soft/50'
                      : 'hover:bg-canvas/50',
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleRow(inv.id)}
                    aria-label={t('selectRow', { number: inv.number })}
                    className={checkboxClass}
                  />
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${inv.number}`}
                    dir="ltr"
                    className="text-brand inline-block font-extrabold tabular-nums hover:underline"
                  >
                    {invoiceLabel(inv)}
                  </Link>
                </td>

                <td className="text-ink-2 px-4 py-3 font-semibold">
                  {inv.customer}
                </td>

                <td className="text-muted px-4 py-3 whitespace-nowrap">
                  {date(inv.issueDate)}
                </td>

                <td
                  className={cn(
                    'px-4 py-3 whitespace-nowrap',
                    overdue ? 'text-danger font-bold' : 'text-muted',
                  )}
                >
                  {date(inv.dueDate)}
                </td>

                <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">
                  {money(inv.total)}
                </td>

                <td
                  className={cn(
                    'px-4 py-3 font-bold whitespace-nowrap tabular-nums',
                    inv.remaining === 0
                      ? 'text-muted'
                      : overdue
                        ? 'text-danger'
                        : 'text-ink',
                  )}
                >
                  {money(inv.remaining)}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge
                    status={inv.status}
                    daysOverdue={inv.daysOverdue}
                  />
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
                      align="start"
                      className="border-line bg-surface text-ink shadow-float min-w-56 rounded-card p-1.5"
                    >
                      <DropdownMenuItem
                        onClick={() => router.push(`/invoices/${inv.number}`)}
                        className="min-h-10 rounded-btn px-3 py-2 font-semibold text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        <Eye className="text-muted size-4" aria-hidden="true" />
                        {t('actions.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDownload(inv.number)}
                        className="min-h-10 rounded-btn px-3 py-2 font-semibold text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        <Download
                          className="text-muted size-4"
                          aria-hidden="true"
                        />
                        {t('actions.download')}
                      </DropdownMenuItem>
                      {onRecordPayment && (
                      <DropdownMenuItem
                        disabled={!canRecordPayment(inv)}
                        onClick={() => onRecordPayment(inv)}
                        className="min-h-10 rounded-btn px-3 py-2 font-semibold text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        <CreditCard
                          className="text-muted size-4"
                          aria-hidden="true"
                        />
                        {t('actions.recordPayment')}
                      </DropdownMenuItem>
                      )}
                      {onCancel && (
                      <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={!canCancel(inv)}
                        onClick={() => onCancel(inv)}
                        className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger min-h-10 rounded-btn px-3 py-2 font-semibold"
                      >
                        <Ban className="size-4" aria-hidden="true" />
                        {t('actions.cancel')}
                      </DropdownMenuItem>
                      </>
                      )}
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
