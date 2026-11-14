// component/dashbord/reports/PnlStatement.tsx
'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { PnlLine } from '@/lib/mock/reports';
import { computePnl } from './utils';
import { useReportMoney } from './useReportMoney';

type Row = {
  key: string;
  amount: number;
  subtotal?: boolean;
};

export default function PnlStatement({ lines }: { lines: PnlLine[] }) {
  const t = useTranslations('Reports.pnl');
  const money = useReportMoney();
  const pnl = computePnl(lines);

  const of = (kind: PnlLine['kind']) => lines.filter((l) => l.kind === kind);

  const rows: Row[] = [
    ...of('income').map((l) => ({ key: l.key, amount: l.amount })),
    ...of('cost').map((l) => ({ key: l.key, amount: -l.amount })),
    { key: 'grossProfit', amount: pnl.grossProfit, subtotal: true },
    ...of('expense').map((l) => ({ key: l.key, amount: -l.amount })),
  ];

  return (
    <div className="rounded-card border-line bg-surface flex flex-col border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <ul className="mt-4 flex-1">
        {rows.map((row) => (
          <li
            key={row.key}
            className="border-line/70 flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
          >
            <span
              className={cn(
                'text-xs',
                row.subtotal
                  ? 'text-ink font-extrabold'
                  : 'text-ink-2 font-semibold',
              )}
            >
              {t(`lines.${row.key}`)}
            </span>
            <span
              className={cn(
                'text-xs font-bold tabular-nums',
                row.subtotal ? 'text-brand-deep font-extrabold' : 'text-ink',
              )}
            >
              {money(row.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-line-strong flex items-center justify-between gap-4 border-t pt-4">
        <span className="text-ink text-sm font-extrabold">
          {t('lines.netProfit')}
        </span>
        <span className="text-brand text-lg font-extrabold tabular-nums">
          {money(pnl.netProfit)}
        </span>
      </div>
    </div>
  );
}
