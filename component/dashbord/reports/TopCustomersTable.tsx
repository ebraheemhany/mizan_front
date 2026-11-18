// component/dashbord/reports/TopCustomersTable.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useMoney } from '@/lib/money';
import type { TopCustomer } from '@/lib/reports/hooks';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs';

export default function TopCustomersTable({
  customers,
  totalRevenue,
}: {
  customers: TopCustomer[];
  /** The period's revenue, for each customer's share. */
  totalRevenue: number;
}) {
  const t = useTranslations('Reports.topCustomers');
  const tApi = useTranslations('ReportsApi');
  const format = useFormatter();
  const money = useMoney();

  const num = (value: number) =>
    format.number(value, { numberingSystem: 'latn' });

  return (
    <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm lg:col-span-2">
      <h2 className="text-ink px-5 pt-5 text-sm font-extrabold">
        {t('title')}
      </h2>

      {customers.length === 0 ? (
        <p className="text-muted px-5 py-10 text-center text-sm">{tApi('noTopCustomers')}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead className="bg-neutral-soft/70">
              <tr>
                <th className={th}>{t('columns.customer')}</th>
                <th className={th}>{t('columns.invoices')}</th>
                <th className={th}>{t('columns.revenue')}</th>
                <th className={th}>{t('columns.share')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const share = totalRevenue > 0 ? c.revenue / totalRevenue : 0;
                return (
                  <tr key={c.id} className="border-line/70 border-t">
                    <td className={`${td} text-ink font-bold`}>
                      <Link href={`/customers/${c.id}`} className="hover:text-brand-deep hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className={`${td} text-ink-2 tabular-nums`}>
                      {num(c.invoicesCount)}
                    </td>
                    <td className={`${td} text-ink font-bold tabular-nums`}>
                      {money(c.revenue)}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className="bg-neutral-soft h-1.5 w-28 overflow-hidden rounded-full">
                          <div
                            className="bg-brand h-full rounded-full"
                            style={{ width: `${Math.min(share, 1) * 100}%` }}
                          />
                        </div>
                        <span className="text-muted w-9 font-semibold tabular-nums">
                          {format.number(share, {
                            style: 'percent',
                            maximumFractionDigits: 0,
                            numberingSystem: 'latn',
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
