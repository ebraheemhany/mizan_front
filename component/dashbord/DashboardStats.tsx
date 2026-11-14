// components/dashboard/DashboardStats.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import Amount from '@/component/Amount';
import StatCard from '@/component/StatCard';
import { DASHBOARD_STATS as s } from '@/lib/mock/dashboard';
import { INVOICE_STATS } from '@/lib/mock/invoices';
import { useMoney } from '@/lib/money';

export default function DashboardStats() {
  const t = useTranslations('Dashboard.stats');
  const format = useFormatter();
  const money = useMoney();

  const change = (v: number) =>
    format.number(v, { signDisplay: 'exceptZero', numberingSystem: 'latn' });

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label={t('revenue')}
        value={<Amount amount={s.revenue} />}
        hint={t('change', { change: change(s.revenueChange) })}
        hintTone="brand"
      />
      <StatCard
        label={t('expenses')}
        value={<Amount amount={s.expenses} />}
        hint={t('change', { change: change(s.expensesChange) })}
      />
      <StatCard
        label={t('netProfit')}
        value={<Amount amount={s.netProfit} />}
        hint={t('change', { change: change(s.netProfitChange) })}
        hintTone="brand"
      />
      <StatCard
        label={t('receivable')}
        value={<Amount amount={INVOICE_STATS.outstanding} />}
        hint={t('overdueHint', { amount: money(INVOICE_STATS.overdue) })}
        hintTone="danger"
      />
    </div>
  );
}
