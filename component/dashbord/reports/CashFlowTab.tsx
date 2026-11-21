// component/dashbord/reports/CashFlowTab.tsx
// Cash in and out of the cash box, bank and e-wallets in the period, from the books.
'use client';

import { useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { useAccountName } from '@/component/dashbord/accounts/ledger-ui';
import { useMoney } from '@/lib/money';
import { CASH_FLOW_SECTIONS, type CashFlow } from '@/lib/reports/hooks';
import { cn } from '@/lib/utils';

const card = 'rounded-card border-line bg-surface border p-5 shadow-sm';

export default function CashFlowTab({ flow }: { flow: CashFlow }) {
  const t = useTranslations('ReportsApi.cashFlow');
  const money = useMoney();
  const accountName = useAccountName();
  const signed = (n: number) => (n > 0 ? `+${money(n)}` : money(n));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('opening')} value={money(flow.opening)} hint={t('openingHint')} />
        <StatCard label={t('net')} value={signed(flow.net)} hint={t('netHint')} />
        <StatCard label={t('closing')} value={money(flow.closing)} hint={t('closingHint')} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className={cn(card, 'space-y-5')}>
          {CASH_FLOW_SECTIONS.map((section) => {
            const lines = flow.lines.filter((l) => l.section === section);
            return (
              <div key={section}>
                <h3 className="text-ink mb-1 text-sm font-extrabold">{t(`sections.${section}`)}</h3>
                <div className="divide-line divide-y">
                  {lines.length === 0 ? (
                    <p className="text-muted py-2.5 text-xs">{t('none')}</p>
                  ) : (
                    lines.map((l) => (
                      <div key={l.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                        <span className="text-ink-2">{t.has(`lines.${l.key}`) ? t(`lines.${l.key}`) : l.key}</span>
                        <span
                          className={cn('font-bold tabular-nums', l.amount < 0 ? 'text-danger' : 'text-brand-deep')}
                        >
                          {signed(l.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-line mt-1 flex items-center justify-between border-t pt-2.5 text-sm font-extrabold">
                  <span className="text-ink">{t('sectionTotal', { section: t(`sections.${section}`) })}</span>
                  <span className={cn('tabular-nums', flow.totals[section] < 0 ? 'text-danger' : 'text-ink')}>
                    {signed(flow.totals[section])}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="border-ink flex items-center justify-between border-t-2 pt-3 text-base font-extrabold">
            <span className="text-ink">{t('net')}</span>
            <span className={cn('tabular-nums', flow.net < 0 ? 'text-danger' : 'text-ink')}>{signed(flow.net)}</span>
          </div>
        </section>

        <section className={card}>
          <h3 className="text-ink mb-2 text-sm font-extrabold">{t('accountsTitle')}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted">
                <th className="py-2 text-start font-bold">{t('account')}</th>
                <th className="py-2 text-end font-bold">{t('opening')}</th>
                <th className="py-2 text-end font-bold">{t('closing')}</th>
              </tr>
            </thead>
            <tbody>
              {flow.accounts.map((a) => (
                <tr key={a.key} className="border-line border-t">
                  <td className="text-ink py-2.5 font-semibold">{accountName({ key: a.key, name: null, code: '' })}</td>
                  <td className="text-ink-2 py-2.5 text-end tabular-nums">{money(a.opening)}</td>
                  <td className={cn('py-2.5 text-end font-bold tabular-nums', a.closing < 0 ? 'text-danger' : 'text-ink')}>
                    {money(a.closing)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted mt-3 text-[11px] leading-5">{t('note')}</p>
        </section>
      </div>
    </div>
  );
}
