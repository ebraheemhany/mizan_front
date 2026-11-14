// components/dashboard/RecentInvoices.tsx
'use client';

import { useTranslations } from 'next-intl';
import { thClass } from '@/component/table-styles';
import { Link } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import { RECENT_INVOICES } from '@/lib/mock/dashboard';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import StatusBadge from './invoices/StatusBadge';

export default function RecentInvoices() {
  const t = useTranslations('Dashboard.recent');
  const money = useMoney();
  const date = useDate();

  return (
    <section className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
        <Link
          href="/invoices"
          className="text-brand text-xs font-bold hover:underline"
        >
          {t('viewAll')}
        </Link>
      </header>

      <div className="border-line overflow-x-auto border-t">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-canvas/60">
            <tr>
              <th className={thClass}>{t('columns.number')}</th>
              <th className={thClass}>{t('columns.customer')}</th>
              <th className={thClass}>{t('columns.date')}</th>
              <th className={thClass}>{t('columns.amount')}</th>
              <th className={thClass}>{t('columns.status')}</th>
            </tr>
          </thead>

          <tbody>
            {RECENT_INVOICES.map((inv) => (
              <tr
                key={inv.id}
                className="border-line hover:bg-canvas/50 border-t transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${inv.number}`}
                    dir="ltr"
                    className={cn(
                      'text-brand inline-block font-extrabold tabular-nums hover:underline',
                    )}
                  >
                    #{inv.number}
                  </Link>
                </td>
                <td className="text-ink-2 px-4 py-3 font-semibold">
                  {inv.customer}
                </td>
                <td className="text-muted px-4 py-3 whitespace-nowrap">
                  {date(inv.issueDate)}
                </td>
                <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">
                  {money(inv.total)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={inv.status}
                    daysOverdue={inv.daysOverdue}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
