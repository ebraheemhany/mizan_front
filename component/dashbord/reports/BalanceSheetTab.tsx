// component/dashbord/reports/BalanceSheetTab.tsx
'use client';

import { useTranslations } from 'next-intl';

import {
  agingBuckets,
  balanceSheetInputs,
  cashBalance,
  vatSummary,
} from '@/lib/mock/reports';
import StatementSection, { type StatementRow } from './StatementSection';
import { computeBalanceSheet } from './utils';
import { useReportMoney } from './useReportMoney';

export default function BalanceSheetTab({ netProfit }: { netProfit: number }) {
  const t = useTranslations('Reports.balanceSheet');
  const money = useReportMoney();

  const receivables = agingBuckets.reduce((s, b) => s + b.amount, 0);
  const vatDue = vatSummary.output - vatSummary.input;

  const bs = computeBalanceSheet({
    cash: cashBalance,
    receivables,
    vatDue,
    netProfit,
    inputs: balanceSheetInputs,
  });

  const label = (key: string) => t(`lines.${key}`);

  const assets: StatementRow[] = [
    { key: 'cash', amount: cashBalance },
    { key: 'receivables', amount: receivables },
    { key: 'fixedAssets', amount: balanceSheetInputs.fixedAssets },
  ];

  const liabilities: StatementRow[] = [
    { key: 'accountsPayable', amount: balanceSheetInputs.accountsPayable },
    { key: 'vatPayable', amount: vatDue },
  ];

  const equity: StatementRow[] = [
    { key: 'capital', amount: balanceSheetInputs.capital },
    { key: 'retainedEarnings', amount: bs.retainedEarnings },
    { key: 'currentProfit', amount: netProfit },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <StatementSection
        title={t('assets')}
        rows={assets}
        totalLabel={t('totalAssets')}
        total={bs.totalAssets}
        money={money}
        label={label}
      />

      <div className="space-y-4">
        <StatementSection
          title={t('liabilities')}
          rows={liabilities}
          totalLabel={t('totalLiabilities')}
          total={bs.totalLiabilities}
          money={money}
          label={label}
        />
        <StatementSection
          title={t('equity')}
          rows={equity}
          totalLabel={t('totalEquity')}
          total={bs.totalEquity}
          money={money}
          label={label}
        />
      </div>
    </div>
  );
}
