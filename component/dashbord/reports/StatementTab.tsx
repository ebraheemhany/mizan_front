// component/dashbord/reports/StatementTab.tsx
'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';

import StatCard from '@/component/StatCard';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { customerStatements } from '@/lib/mock/reports';
import { computeStatement } from './utils';
import { useReportMoney } from './useReportMoney';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs tabular-nums';

export default function StatementTab({
  customerId,
  onCustomerChange,
}: {
  customerId: string;
  onCustomerChange: (customerId: string) => void;
}) {
  const t = useTranslations('Reports.statementTab');
  const format = useFormatter();
  const money = useReportMoney();

  const customer =
    customerStatements.find((c) => c.id === customerId) ??
    customerStatements[0];

  const statement = useMemo(() => computeStatement(customer), [customer]);

  const date = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  // الصفر بيتعرض شرطة علشان الجدول يتقري أسهل
  const cell = (value: number) => (value > 0 ? money(value) : '—');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-ink-2 text-xs font-bold">{t('customer')}</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'rounded-btn border-line-strong bg-surface text-ink hover:border-brand/30 hover:bg-canvas focus-visible:ring-brand/30 h-10 w-full justify-between gap-2 border text-xs font-bold shadow-sm transition-colors focus-visible:ring-2 sm:w-64',
            )}
          >
            <span className="truncate">{customer.name}</span>
            <ChevronDown className="text-muted size-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="border-line bg-surface text-ink min-w-64 rounded-xl p-1.5 shadow-lg"
          >
            {customerStatements.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => onCustomerChange(c.id)}
                className={cn(
                  'rounded-btn min-h-10 justify-between px-3 py-2 text-xs font-semibold transition-colors data-highlighted:bg-brand-soft data-highlighted:text-brand-deep',
                  c.id === customer.id &&
                    'bg-brand-soft text-brand-deep font-bold',
                )}
              >
                <span className="truncate">{c.name}</span>
                {c.id === customer.id && (
                  <Check className="text-brand size-4 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('stats.opening')}
          value={money(statement.opening)}
          hint={t('stats.openingHint')}
        />
        <StatCard
          label={t('stats.invoiced')}
          value={money(statement.invoiced)}
          hint={t('stats.invoicedHint')}
        />
        <StatCard
          label={t('stats.paid')}
          value={money(statement.paid)}
          hint={t('stats.paidHint')}
          tone="brand"
          hintTone="default"
        />
        <StatCard
          label={t('stats.closing')}
          value={money(statement.closing)}
          hint={t('stats.closingHint')}
          tone={statement.closing > 0 ? 'danger' : 'brand'}
          hintTone="default"
        />
      </div>

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <h2 className="text-ink px-5 pt-5 text-sm font-extrabold">
          {t('table.title', { name: customer.name })}
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="bg-neutral-soft/70">
              <tr>
                <th className={th}>{t('table.date')}</th>
                <th className={th}>{t('table.description')}</th>
                <th className={th}>{t('table.debit')}</th>
                <th className={th}>{t('table.credit')}</th>
                <th className={th}>{t('table.balance')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-line/70 border-t">
                <td className={td} />
                <td className={cn(td, 'text-ink-2 font-semibold')}>
                  {t('table.opening')}
                </td>
                <td className={td} />
                <td className={td} />
                <td className={cn(td, 'text-ink font-bold')}>
                  {money(statement.opening)}
                </td>
              </tr>

              {statement.rows.map((row) => (
                <tr key={row.id} className="border-line/70 border-t">
                  <td className={cn(td, 'text-ink-2')}>{date(row.date)}</td>
                  <td className={cn(td, 'text-ink font-semibold')}>
                    {t(`table.types.${row.type}`)}
                    <span className="text-muted ms-2 font-normal">
                      {row.ref}
                    </span>
                  </td>
                  <td className={cn(td, 'text-ink')}>
                    {cell(row.type === 'invoice' ? row.amount : 0)}
                  </td>
                  <td className={cn(td, 'text-brand-deep font-bold')}>
                    {cell(row.type === 'payment' ? row.amount : 0)}
                  </td>
                  <td className={cn(td, 'text-ink font-bold')}>
                    {money(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-line-strong bg-neutral-soft/70 border-t">
                <td className={td} />
                <td className={cn(td, 'text-ink font-extrabold')}>
                  {t('table.closing')}
                </td>
                <td className={cn(td, 'text-ink font-extrabold')}>
                  {money(statement.invoiced)}
                </td>
                <td className={cn(td, 'text-brand-deep font-extrabold')}>
                  {money(statement.paid)}
                </td>
                <td
                  className={cn(
                    td,
                    'font-extrabold',
                    statement.closing > 0 ? 'text-danger' : 'text-brand',
                  )}
                >
                  {money(statement.closing)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
