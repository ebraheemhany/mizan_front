// component/dashbord/expenses/ExpensesTable.tsx
'use client';

import { useRef } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { FileText, ImageIcon, Paperclip, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import type { Expense } from '@/lib/mock/expenses';

/** What can be done with receipts here (none for roles that can't change expenses). */
export type ReceiptActions = {
  onView: (expense: Expense) => void;
  onAttach: (expense: Expense, file: File) => void;
  onRemove: (expense: Expense) => void;
};

function ReceiptCell({ expense, actions }: { expense: Expense; actions?: ReceiptActions }) {
  const t = useTranslations('ExpensesApi.receipts');
  const fileRef = useRef<HTMLInputElement>(null);
  const receipt = expense.receipt;
  const Icon = receipt?.contentType === 'application/pdf' ? FileText : ImageIcon;

  return (
    <span className="inline-flex items-center gap-1">
      {receipt && actions ? (
        <button
          type="button"
          onClick={() => actions.onView(expense)}
          title={receipt.name ?? t('view')}
          className="text-brand-deep hover:bg-brand-soft inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold"
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {t('view')}
        </button>
      ) : null}
      {actions && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              if (file) actions.onAttach(expense, file);
              ev.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={receipt ? t('replace') : t('attach')}
            title={receipt ? t('replace') : t('attach')}
            className="text-muted hover:bg-neutral-soft hover:text-ink rounded-md p-1"
          >
            <Paperclip className="size-3.5" />
          </button>
          {receipt && (
            <button
              type="button"
              onClick={() => actions.onRemove(expense)}
              aria-label={t('remove')}
              title={t('remove')}
              className="text-muted hover:bg-danger-soft hover:text-danger rounded-md p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
        </>
      )}
      {!actions && !receipt && <span className="text-muted">—</span>}
    </span>
  );
}

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs';

export default function ExpensesTable({ rows, receipts }: { rows: Expense[]; receipts?: ReceiptActions }) {
  const t = useTranslations('Expenses');
  const format = useFormatter();
  const money = useMoney();

  const date = (iso: string, withYear: boolean) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      ...(withYear ? { year: 'numeric' as const } : {}),
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="bg-neutral-soft/70">
          <tr>
            <th className={th}>{t('table.date')}</th>
            <th className={th}>{t('table.title')}</th>
            <th className={th}>{t('table.category')}</th>
            <th className={th}>{t('table.paidFrom')}</th>
            <th className={th}>{t('table.amount')}</th>
            <th className={th}>{t('table.status')}</th>
            <th className={th}>{t('table.receipt')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-line/70 border-t">
              <td className={cn(td, 'text-ink-2 tabular-nums')}>
                {date(e.date, true)}
              </td>
              <td className={cn(td, 'text-ink font-bold')}>{e.title}</td>
              <td className={td}>
                <span className="bg-neutral-soft text-ink-2 rounded-md px-2 py-1 text-[11px] font-semibold">
                  {t(`categories.${e.category}`)}
                </span>
              </td>
              <td className={cn(td, 'text-ink-2')}>
                {e.paidFrom ? t(`sources.${e.paidFrom}`) : '—'}
              </td>
              <td className={cn(td, 'text-ink font-bold tabular-nums')}>
                {money(e.amount)}
              </td>
              <td className={td}>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                    e.status === 'paid'
                      ? 'bg-brand-soft text-brand-deep'
                      : 'bg-amber-50 text-amber-800',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      e.status === 'paid' ? 'bg-brand' : 'bg-amber-500',
                    )}
                  />
                  {e.status === 'paid'
                    ? t('status.paid')
                    : e.dueDate
                      ? t('status.due', { date: date(e.dueDate, false) })
                      : t('status.unpaid')}
                </span>
              </td>
              <td className={td}>
                <ReceiptCell expense={e} actions={receipts} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
