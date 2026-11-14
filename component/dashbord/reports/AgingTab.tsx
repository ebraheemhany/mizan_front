// component/dashbord/reports/AgingTab.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { cn } from '@/lib/utils';
import { agingBuckets, agingRows, type AgingBucket } from '@/lib/mock/reports';
import AgingCard from './AgingCard';
import { useReportMoney } from './useReportMoney';

const BUCKETS: AgingBucket['key'][] = ['notDue', 'd1_30', 'd31_60', 'd60plus'];

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs tabular-nums';

export default function AgingTab() {
  const t = useTranslations('Reports');
  const format = useFormatter();
  const money = useReportMoney();

  const total = agingBuckets.reduce((s, b) => s + b.amount, 0);
  const notDue = agingBuckets.find((b) => b.key === 'notDue')?.amount ?? 0;
  const overdue = total - notDue;
  const overdueShare = total > 0 ? overdue / total : 0;
  const overdueCustomers = agingRows.filter(
    (r) => r.d1_30 + r.d31_60 + r.d60plus > 0,
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('agingTab.stats.total')}
          value={money(total)}
          hint={t('agingTab.stats.totalHint')}
        />
        <StatCard
          label={t('agingTab.stats.overdue')}
          value={money(overdue)}
          hint={format.number(overdueShare, {
            style: 'percent',
            maximumFractionDigits: 0,
            numberingSystem: 'latn',
          })}
          tone={overdue > 0 ? 'danger' : 'brand'}
          hintTone="default"
        />
        <StatCard
          label={t('agingTab.stats.customers')}
          value={format.number(overdueCustomers, { numberingSystem: 'latn' })}
          hint={t('agingTab.stats.customersHint')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AgingCard buckets={agingBuckets} />

        <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm lg:col-span-2">
          <h2 className="text-ink px-5 pt-5 text-sm font-extrabold">
            {t('agingTab.table.title')}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead className="bg-neutral-soft/70">
                <tr>
                  <th className={th}>{t('agingTab.table.customer')}</th>
                  {BUCKETS.map((key) => (
                    <th key={key} className={th}>
                      {t(`aging.buckets.${key}`)}
                    </th>
                  ))}
                  <th className={th}>{t('agingTab.table.total')}</th>
                </tr>
              </thead>
              <tbody>
                {agingRows.map((row) => {
                  const rowTotal = BUCKETS.reduce((s, k) => s + row[k], 0);
                  return (
                    <tr key={row.id} className="border-line/70 border-t">
                      <td className={cn(td, 'text-ink font-bold')}>
                        {row.name}
                      </td>
                      {BUCKETS.map((key) => (
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
                        {money(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
