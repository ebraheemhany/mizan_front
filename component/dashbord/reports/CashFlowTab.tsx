// component/dashbord/reports/CashFlowTab.tsx
'use client';

import { useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { cashBalance, cashFlowInputs } from '@/lib/mock/reports';
import StatementSection, { type StatementRow } from './StatementSection';
import { computeCashFlow } from './utils';
import { useReportMoney } from './useReportMoney';

export default function CashFlowTab({ netProfit }: { netProfit: number }) {
  const t = useTranslations('Reports.cashFlow');
  const money = useReportMoney();

  const cf = computeCashFlow({
    netProfit,
    closingCash: cashBalance,
    inputs: cashFlowInputs,
  });

  const label = (key: string) => t(`lines.${key}`);

  const operating: StatementRow[] = [
    { key: 'netProfit', amount: netProfit },
    { key: 'receivablesChange', amount: -cashFlowInputs.receivablesIncrease },
    { key: 'payablesChange', amount: cashFlowInputs.payablesIncrease },
  ];

  const investing: StatementRow[] = [
    { key: 'equipment', amount: -cashFlowInputs.equipmentPurchase },
  ];

  const financing: StatementRow[] = [
    { key: 'ownerWithdrawals', amount: -cashFlowInputs.ownerWithdrawals },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('summary.opening')}
          value={money(cf.openingCash)}
          hint={t('summary.openingHint')}
        />
        <StatCard
          label={t('summary.netChange')}
          value={money(cf.netChange)}
          hint={t('summary.netChangeHint')}
          tone={cf.netChange < 0 ? 'danger' : 'brand'}
          hintTone="default"
        />
        <StatCard
          label={t('summary.closing')}
          value={money(cf.closingCash)}
          hint={t('summary.closingHint')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatementSection
          title={t('operating')}
          rows={operating}
          totalLabel={t('totalOperating')}
          total={cf.operating}
          money={money}
          label={label}
        />

        <div className="space-y-4">
          <StatementSection
            title={t('investing')}
            rows={investing}
            totalLabel={t('totalInvesting')}
            total={cf.investing}
            money={money}
            label={label}
          />
          <StatementSection
            title={t('financing')}
            rows={financing}
            totalLabel={t('totalFinancing')}
            total={cf.financing}
            money={money}
            label={label}
          />
        </div>
      </div>
    </div>
  );
}