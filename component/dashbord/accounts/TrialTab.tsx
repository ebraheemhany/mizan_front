// component/dashbord/accounts/TrialTab.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import FilterPopover from '@/component/dashbord/FilterPopover';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useTrialBalance } from '@/lib/ledger/hooks';
import { cn } from '@/lib/utils';
import { card, downloadCsv, outlineBtn, td, th, useAccountName, useMonthLabel, useNum } from './ledger-ui';

export default function TrialTab({ currentMonth }: { currentMonth: string }) {
  const t = useTranslations('Accounts');
  const num = useNum();
  const monthLabel = useMonthLabel();
  const accountName = useAccountName();
  const errorMessage = useApiErrorMessage();

  const [month, setMonth] = useState(currentMonth);
  const trial = useTrialBalance(month);
  const data = trial.data;
  // The months with entries, and this month even before anything is in it.
  const months = [...new Set([currentMonth, ...(data?.months ?? [])])].sort().reverse();
  const title = month === 'all' ? t('trialTab.allPeriods') : monthLabel(month);

  const handleExport = () => {
    if (!data) return;
    downloadCsv(
      `trial-balance-${month}.csv`,
      [t('tree.code'), t('trial.account'), t('tree.type'), t('trial.debit'), t('trial.credit')],
      [
        ...data.rows.map((r) => [
          r.account.code,
          accountName(r.account),
          t(`types.${r.account.type}`),
          r.debit ? r.debit.toFixed(2) : '',
          r.credit ? r.credit.toFixed(2) : '',
        ]),
        ['', t('trial.total'), '', data.totalDebit.toFixed(2), data.totalCredit.toFixed(2)],
      ],
    );
    toast.success(t('trialTab.exported'));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={cn(card, 'p-5')}>
          <p className="text-muted text-xs font-bold">{t('trialTab.totalDebit')}</p>
          <p className="text-ink mt-2 text-2xl font-extrabold tabular-nums">{num(data?.totalDebit ?? 0)}</p>
        </div>
        <div className={cn(card, 'p-5')}>
          <p className="text-muted text-xs font-bold">{t('trialTab.totalCredit')}</p>
          <p className="text-ink mt-2 text-2xl font-extrabold tabular-nums">{num(data?.totalCredit ?? 0)}</p>
        </div>
        <div
          className={cn(
            card,
            'p-5',
            data &&
              data.rows.length > 0 &&
              (data.balanced ? 'border-brand bg-brand-soft/40' : 'border-danger bg-danger-soft'),
          )}
        >
          <p className="text-muted text-xs font-bold">{t('trialTab.status')}</p>
          <p
            className={cn(
              'mt-2 text-2xl font-extrabold',
              !data || data.balanced ? 'text-brand-deep' : 'text-danger',
            )}
          >
            {!data || data.balanced
              ? t('trialTab.balanced')
              : t('trialTab.difference', { amount: num(Math.abs(data.totalDebit - data.totalCredit)) })}
          </p>
        </div>
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <h2 className="text-ink text-base font-extrabold">{t('trial.title', { month: title })}</h2>

          <div className="flex flex-wrap items-center gap-3">
            <FilterPopover
              icon={CalendarDays}
              label={t('trialTab.periodLabel')}
              value={month}
              allValue="all"
              onChange={setMonth}
              options={[
                { value: 'all', label: t('trialTab.allPeriods') },
                ...months.map((m) => ({ value: m, label: monthLabel(m) })),
              ]}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={!data || data.rows.length === 0}
              className={cn(outlineBtn, 'shadow-sm')}
            >
              <Download className="size-4" />
              {t('export')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t('tree.code')}</th>
                <th className={th}>{t('trial.account')}</th>
                <th className={th}>{t('tree.type')}</th>
                <th className={th}>{t('trial.debit')}</th>
                <th className={th}>{t('trial.credit')}</th>
              </tr>
            </thead>
            <tbody>
              {trial.isPending ? (
                <tr>
                  <td colSpan={5} className="text-muted py-12 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : trial.isError ? (
                <tr>
                  <td colSpan={5} className="text-danger py-12 text-center text-sm font-semibold">
                    {errorMessage(trial.error)}
                  </td>
                </tr>
              ) : !data || data.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted py-12 text-center text-sm">
                    {t('trialTab.empty')}
                  </td>
                </tr>
              ) : (
                data.rows.map((r) => (
                  <tr key={r.account.id} className="border-line border-t">
                    <td className={cn(td, 'text-ink-2 tabular-nums')}>{r.account.code}</td>
                    <td className={cn(td, 'text-ink font-bold')}>{accountName(r.account)}</td>
                    <td className={cn(td, 'text-ink-2')}>{t(`types.${r.account.type}`)}</td>
                    <td className={cn(td, 'text-ink-2 tabular-nums')}>{r.debit ? num(r.debit) : '—'}</td>
                    <td className={cn(td, 'text-ink-2 tabular-nums')}>{r.credit ? num(r.credit) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {data && data.rows.length > 0 && (
              <tfoot>
                <tr className="border-line bg-canvas border-t-2">
                  <td colSpan={3} className={cn(td, 'text-ink font-extrabold')}>
                    {t('trial.total')}
                  </td>
                  <td className={cn(td, 'text-ink font-extrabold tabular-nums')}>{num(data.totalDebit)}</td>
                  <td className={cn(td, 'text-ink font-extrabold tabular-nums')}>{num(data.totalCredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="border-line text-muted space-y-1 border-t p-4 text-[11px]">
          <p>{month === 'all' ? t('trialTab.noteAll') : t('trialTab.note')}</p>
          {data && data.drafts > 0 && <p>{t('trialTab.draftNote', { count: data.drafts })}</p>}
        </div>
      </section>
    </div>
  );
}
