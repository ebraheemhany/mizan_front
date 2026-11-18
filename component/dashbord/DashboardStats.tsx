// components/dashboard/DashboardStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import Amount from '@/component/Amount';
import StatCard from '@/component/StatCard';
import { useMoney } from '@/lib/money';
import { useDashboard } from '@/lib/payments/hooks';

export default function DashboardStats() {
  const t = useTranslations('Dashboard.stats');
  const tApi = useTranslations('DashboardApi');
  const format = useFormatter();
  const money = useMoney();
  const { data } = useDashboard();

  // Change vs last month, or a plain note when there is nothing to compare with.
  const change = (v: number | null) =>
    v === null
      ? tApi('noComparison')
      : t('change', { change: format.number(v, { signDisplay: 'exceptZero', numberingSystem: 'latn' }) });

  const f = data?.financials;
  const receivable = (
    <StatCard
      label={t('receivable')}
      value={<Amount amount={Number(data?.receivable.outstanding ?? 0)} />}
      hint={t('overdueHint', { amount: money(Number(data?.receivable.overdue ?? 0)) })}
      hintTone="danger"
    />
  );

  // Roles that may not see financial reports only get what is owed to the company.
  if (data && !f) return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{receivable}</div>;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label={t('revenue')}
        value={<Amount amount={Number(f?.revenue ?? 0)} />}
        hint={change(f?.revenueChange ?? null)}
        hintTone="brand"
      />
      <StatCard
        label={t('expenses')}
        value={<Amount amount={Number(f?.expenses ?? 0)} />}
        hint={change(f?.expensesChange ?? null)}
      />
      <StatCard
        label={t('netProfit')}
        value={<Amount amount={Number(f?.netProfit ?? 0)} />}
        hint={change(f?.netProfitChange ?? null)}
        hintTone="brand"
      />
      {receivable}
    </div>
  );
}
