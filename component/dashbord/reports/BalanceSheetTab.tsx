// component/dashbord/reports/BalanceSheetTab.tsx
// What the company has and owes, from the books.
'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';

import { useAccountName } from '@/component/dashbord/accounts/ledger-ui';
import { useDate } from '@/lib/data';
import { useMoney } from '@/lib/money';
import type { BalanceSheet, StatementRow } from '@/lib/reports/hooks';
import { cn } from '@/lib/utils';

const card = 'rounded-card border-line bg-surface border p-5 shadow-sm';

function Row({ label, amount, strong, muted }: { label: string; amount: number; strong?: boolean; muted?: boolean }) {
  const money = useMoney();
  return (
    <div className={cn('flex items-center justify-between gap-4 py-2.5 text-sm', strong && 'font-extrabold')}>
      <span className={cn(strong ? 'text-ink' : muted ? 'text-muted' : 'text-ink-2')}>{label}</span>
      <span
        className={cn(
          'tabular-nums',
          strong ? 'text-ink' : 'text-ink-2 font-bold',
          amount < 0 && 'text-danger',
        )}
      >
        {money(amount)}
      </span>
    </div>
  );
}

function Section({ title, rows, total, totalLabel, extra }: {
  title: string;
  rows: StatementRow[];
  total: number;
  totalLabel: string;
  extra?: React.ReactNode;
}) {
  const t = useTranslations('ReportsApi.balanceSheet');
  const accountName = useAccountName();
  return (
    <div>
      <h3 className="text-muted mb-1 text-xs font-extrabold">{title}</h3>
      <div className="divide-line divide-y">
        {rows.length === 0 && !extra ? (
          <p className="text-muted py-2.5 text-xs">{t('none')}</p>
        ) : (
          rows.map((r) => <Row key={r.account.id} label={accountName(r.account)} amount={r.amount} />)
        )}
        {extra}
      </div>
      <div className="border-ink mt-1 border-t-2">
        <Row label={totalLabel} amount={total} strong />
      </div>
    </div>
  );
}

export default function BalanceSheetTab({ sheet }: { sheet: BalanceSheet }) {
  const t = useTranslations('ReportsApi.balanceSheet');
  const formatDate = useDate();
  const money = useMoney();

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-card flex flex-wrap items-center justify-between gap-3 border px-5 py-3 text-xs font-semibold',
          sheet.balanced ? 'border-brand/40 bg-brand-soft/40 text-brand-deep' : 'border-danger bg-danger-soft text-danger',
        )}
      >
        <span className="flex items-center gap-2">
          {sheet.balanced ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {sheet.balanced
            ? t('balanced')
            : t('unbalanced', { amount: money(Math.abs(sheet.assets.total - sheet.totalLiabilitiesAndEquity)) })}
        </span>
        <span className="text-muted">{t('asOf', { date: formatDate(sheet.asOf) })}</span>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-ink mb-3 text-base font-extrabold">{t('assets')}</h2>
          <Section
            title={t('assetsSection')}
            rows={sheet.assets.rows}
            total={sheet.assets.total}
            totalLabel={t('totalAssets')}
          />
        </section>

        <section className={cn(card, 'space-y-5')}>
          <h2 className="text-ink text-base font-extrabold">{t('liabilitiesAndEquity')}</h2>
          <Section
            title={t('liabilities')}
            rows={sheet.liabilities.rows}
            total={sheet.liabilities.total}
            totalLabel={t('totalLiabilities')}
          />
          <Section
            title={t('equity')}
            rows={sheet.equity.rows}
            total={sheet.equity.total}
            totalLabel={t('totalEquity')}
            extra={
              <>
                {sheet.equity.priorYearsProfit !== 0 && (
                  <Row label={t('priorYearsProfit')} amount={sheet.equity.priorYearsProfit} />
                )}
                <Row label={t('yearProfit')} amount={sheet.equity.yearProfit} />
              </>
            }
          />
          <div className="bg-canvas rounded-btn px-3">
            <Row label={t('totalLiabilitiesAndEquity')} amount={sheet.totalLiabilitiesAndEquity} strong />
          </div>
        </section>
      </div>
      <p className="text-muted text-[11px] leading-5">{t('note')}</p>
    </div>
  );
}
