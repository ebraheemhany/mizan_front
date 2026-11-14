// components/customers/CustomerInvoicesCard.tsx
'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { thClass } from '@/component/table-styles';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import type { Invoice } from '@/lib/mock/invoices';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import InvoiceStatusBadge from '@/component/dashbord/invoices/StatusBadge';

export default function CustomerInvoicesCard({
  invoices,
}: {
  invoices: Invoice[];
}) {
  const t = useTranslations('CustomerDetail.invoices');
  const money = useMoney();
  const date = useDate();

  return (
    <section className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
      <header className="px-5 py-4 sm:px-6">
        <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
      </header>

      {invoices.length === 0 ? (
        <div className="border-line border-t px-4 py-12 text-center">
          <p className="text-muted text-sm">{t('empty')}</p>
          <Link
            href="/invoices/new"
            className={cn(
              buttonVariants(),
              'rounded-btn bg-brand hover:bg-brand/90 mt-4 h-10 gap-2 text-xs font-bold text-white',
            )}
          >
            <Plus className="size-4" />
            {t('create')}
          </Link>
        </div>
      ) : (
        <div className="border-line overflow-x-auto border-t">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-canvas/60">
              <tr>
                <th className={thClass}>{t('columns.number')}</th>
                <th className={thClass}>{t('columns.date')}</th>
                <th className={thClass}>{t('columns.due')}</th>
                <th className={thClass}>{t('columns.total')}</th>
                <th className={thClass}>{t('columns.remaining')}</th>
                <th className={thClass}>{t('columns.status')}</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((inv) => {
                const overdue = inv.status === 'overdue';

                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      'border-line border-t transition-colors',
                      overdue ? 'bg-danger-soft/50' : 'hover:bg-canvas/50',
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${inv.number}`}
                        dir="ltr"
                        className="text-brand inline-block font-extrabold tabular-nums hover:underline"
                      >
                        #{inv.number}
                      </Link>
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
                      <InvoiceStatusBadge
                        status={inv.status}
                        daysOverdue={inv.daysOverdue}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
