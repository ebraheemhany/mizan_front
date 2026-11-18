// component/dashbord/reports/AgingTab.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { Link } from '@/i18n/navigation';
import { useMoney } from '@/lib/money';
import { AGING_BUCKETS, type AgingReport } from '@/lib/reports/hooks';
import { cn } from '@/lib/utils';
import AgingCard from './AgingCard';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs tabular-nums';

/** Open balances by days past due. Every total here comes from the server. */
export default function AgingTab({ aging }: { aging: AgingReport }) {
  const t = useTranslations('Reports');
  const tApi = useTranslations('ReportsApi');
  const format = useFormatter();
  const money = useMoney();

  const bucketTotal = (key: (typeof AGING_BUCKETS)[number]) =>
    aging.buckets.find((b) => b.key === key)?.amount ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('agingTab.stats.total')}
          value={money(aging.total)}
          hint={t('agingTab.stats.totalHint')}
        />
        <StatCard
          label={t('agingTab.stats.overdue')}
          value={money(aging.overdue)}
          hint={format.number(aging.total > 0 ? aging.overdue / aging.total : 0, {
            style: 'percent',
            maximumFractionDigits: 0,
            numberingSystem: 'latn',
          })}
          tone={aging.overdue > 0 ? 'danger' : 'brand'}
          hintTone="default"
        />
        <StatCard
          label={t('agingTab.stats.customers')}
          value={format.number(aging.overdueCustomers, { numberingSystem: 'latn' })}
          hint={t('agingTab.stats.customersHint')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AgingCard buckets={aging.buckets} />

        <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm lg:col-span-2">
          <h2 className="text-ink px-5 pt-5 text-sm font-extrabold">
            {t('agingTab.table.title')}
          </h2>
          {aging.rows.length === 0 ? (
            <p className="text-muted px-5 py-14 text-center text-sm">{tApi('noReceivables')}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead className="bg-neutral-soft/70">
                  <tr>
                    <th className={th}>{t('agingTab.table.customer')}</th>
                    {AGING_BUCKETS.map((key) => (
                      <th key={key} className={th}>
                        {t(`aging.buckets.${key}`)}
                      </th>
                    ))}
                    <th className={th}>{t('agingTab.table.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.rows.map((row) => (
                    <tr key={row.id} className="border-line/70 border-t">
                      <td className={cn(td, 'text-ink font-bold')}>
                        <Link href={`/customers/${row.id}`} className="hover:text-brand-deep hover:underline">
                          {row.name}
                        </Link>
                      </td>
                      {AGING_BUCKETS.map((key) => (
                        <td
                          key={key}
                          className={cn(
                            td,
                            row[key] === 0
                              ? 'text-muted'
                              : key === 'notDue'
                                ? 'text-ink-2'
                                : 'text-danger font-bold',
                          )}
                        >
                          {money(row[key])}
                        </td>
                      ))}
                      <td className={cn(td, 'text-ink font-extrabold')}>
                        {money(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-line-strong bg-neutral-soft/70 border-t">
                    <td className={cn(td, 'text-ink font-extrabold')}>{t('agingTab.table.total')}</td>
                    {AGING_BUCKETS.map((key) => (
                      <td key={key} className={cn(td, 'text-ink font-extrabold')}>
                        {money(bucketTotal(key))}
                      </td>
                    ))}
                    <td className={cn(td, 'text-ink font-extrabold')}>{money(aging.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
