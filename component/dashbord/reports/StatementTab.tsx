// component/dashbord/reports/StatementTab.tsx
'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { useMoney } from '@/lib/money';
import type { CustomerStatement } from '@/lib/reports/hooks';
import { cn } from '@/lib/utils';
import { ReportState } from './ReportState';
import StatementCustomerPicker from './StatementCustomerPicker';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs tabular-nums';

export type StatementCustomer =
  | { status: 'ready'; id: string; name: string | null }
  /** Finding the default customer (largest balance). */
  | { status: 'loading' }
  | { status: 'error'; error: unknown; retry: () => void }
  /** The company has no customers. */
  | { status: 'none' };

/** A customer's account for the period: opening balance, invoices, payments and the running balance (all from the server). */
export default function StatementTab({
  customer,
  query,
  onCustomerChange,
}: {
  customer: StatementCustomer;
  query: UseQueryResult<CustomerStatement>;
  onCustomerChange: (customer: { id: string; name: string }) => void;
}) {
  const t = useTranslations('Reports.statementTab');
  const tApi = useTranslations('ReportsApi');
  const tStatus = useTranslations('Payments.status');
  const format = useFormatter();
  // A statement is read to the piaster.
  const money = useMoney({ cents: true });

  const id = customer.status === 'ready' ? customer.id : null;
  const statement = query.data;
  const name = statement?.customer.id === id ? statement.customer.name : customer.status === 'ready' ? customer.name : null;

  const date = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  // الصفر بيتعرض شرطة علشان الجدول يتقري أسهل
  const cell = (value: number) => (value > 0 ? money(value) : '—');

  let body: ReactNode;
  if (customer.status === 'none') {
    body = (
      <div className="rounded-card border-line bg-surface text-muted border px-5 py-14 text-center text-sm shadow-sm">
        {tApi('noCustomers')}
      </div>
    );
  } else if (customer.status === 'loading') {
    body = <ReportState onRetry={() => undefined} />;
  } else if (customer.status === 'error') {
    body = <ReportState error={customer.error} onRetry={customer.retry} />;
  } else if (!statement) {
    body = <ReportState error={query.isError ? query.error : undefined} onRetry={() => void query.refetch()} />;
  } else {
    body = (
      <>
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
            {t('table.title', { name: statement.customer.name })}
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

                {statement.txns.length === 0 && (
                  <tr className="border-line/70 border-t">
                    <td colSpan={5} className={cn(td, 'text-muted py-8 text-center')}>
                      {tApi('noActivity')}
                    </td>
                  </tr>
                )}

                {statement.txns.map((row) => (
                  <tr key={row.id} className="border-line/70 border-t">
                    <td className={cn(td, 'text-ink-2')}>{date(row.date)}</td>
                    <td className={cn(td, 'text-ink font-semibold')}>
                      {t(`table.types.${row.type}`)}
                      <span className="text-muted ms-2 font-normal">
                        {row.ref}
                        {row.invoiceRef && ` · ${tApi('onInvoice', { ref: row.invoiceRef })}`}
                      </span>
                      {/* A cheque lowers the balance at once but is collected only when it clears. */}
                      {row.pending && (
                        <span className="ms-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {tStatus('pending')}
                        </span>
                      )}
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
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-ink-2 text-xs font-bold">{t('customer')}</span>
        <StatementCustomerPicker value={id} label={name} onChange={onCustomerChange} />
      </div>
      {body}
    </div>
  );
}
