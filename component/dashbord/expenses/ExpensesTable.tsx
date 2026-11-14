// component/dashbord/expenses/ExpensesTable.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import type { Expense } from '@/lib/mock/expenses';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs';

export default function ExpensesTable({ rows }: { rows: Expense[] }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
