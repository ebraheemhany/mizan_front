// component/dashbord/accounts/TrialTab.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { CalendarDays, Download } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ACCOUNTS_MONTH, type JournalEntry } from '@/lib/mock/accounts';
import { computeTrial } from '@/lib/trial-balance';
import FilterPopover from '@/component/dashbord/FilterPopover';

const card = 'rounded-card border-line bg-surface border shadow-sm';
const th =
  'bg-canvas text-muted px-4 py-3 text-start text-xs font-bold whitespace-nowrap';
const td = 'px-4 py-3.5 text-xs';

export default function TrialTab({ entries }: { entries: JournalEntry[] }) {
  const t = useTranslations('Accounts');
  const format = useFormatter();

  const [month, setMonth] = useState(ACCOUNTS_MONTH.slice(0, 7));

  const num = (n: number) =>
    format.number(n, { numberingSystem: 'latn', maximumFractionDigits: 2 });

  const monthLabel = (m: string) =>
    format.dateTime(new Date(`${m}-01T00:00:00Z`), {
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  // الشهور من القيود نفسها (الأحدث أولاً)
  const months = [...new Set(entries.map((e) => e.date.slice(0, 7)))]
    .sort()
    .reverse();

  const trial = computeTrial(entries, month);

  // TODO: بدّله بـ lib/export-csv.ts لو شكله مناسب
  const handleExport = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      t('tree.code'),
      t('trial.account'),
      t('tree.type'),
      t('trial.debit'),
      t('trial.credit'),
    ];
    const lines = trial.rows.map((r) =>
      [
        r.code,
        t(`names.${r.key}`),
        t(`types.${r.type}`),
        r.debit ? String(r.debit) : '',
        r.credit ? String(r.credit) : '',
      ]
        .map(cell)
        .join(','),
    );
    lines.push(
      [
        '',
        t('trial.total'),
        '',
        String(trial.totalDebit),
        String(trial.totalCredit),
      ]
        .map(cell)
        .join(','),
    );
    const csv = '\uFEFF' + [header.map(cell).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('trialTab.exported'));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={cn(card, 'p-5')}>
          <p className="text-muted text-xs font-bold">
            {t('trialTab.totalDebit')}
          </p>
          <p className="text-ink mt-2 text-2xl font-extrabold">
            {num(trial.totalDebit)}
          </p>
        </div>
        <div className={cn(card, 'p-5')}>
          <p className="text-muted text-xs font-bold">
            {t('trialTab.totalCredit')}
          </p>
          <p className="text-ink mt-2 text-2xl font-extrabold">
            {num(trial.totalCredit)}
          </p>
        </div>
        <div
          className={cn(
            card,
            'p-5',
            trial.rows.length > 0 &&
              (trial.balanced
                ? 'border-brand bg-brand-soft/40'
                : 'border-danger bg-danger-soft'),
          )}
        >
          <p className="text-muted text-xs font-bold">{t('trialTab.status')}</p>
          <p
            className={cn(
              'mt-2 text-2xl font-extrabold',
              trial.balanced ? 'text-brand-deep' : 'text-danger',
            )}
          >
            {trial.balanced
              ? t('trialTab.balanced')
              : t('trialTab.difference', {
                  amount: num(Math.abs(trial.difference)),
                })}
          </p>
        </div>
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <h2 className="text-ink text-base font-extrabold">
            {t('trial.title', {
              month:
                month === 'all' ? t('trialTab.allPeriods') : monthLabel(month),
            })}
          </h2>

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
              disabled={trial.rows.length === 0}
              className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn flex h-10 items-center gap-2 border px-4 text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
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
              {trial.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted py-12 text-center text-sm"
                  >
                    {t('trialTab.empty')}
                  </td>
                </tr>
              ) : (
                trial.rows.map((r) => (
                  <tr key={r.key} className="border-line border-t">
                    <td className={cn(td, 'text-ink-2')}>{r.code}</td>
                    <td className={cn(td, 'text-ink font-bold')}>
                      {t(`names.${r.key}`)}
                    </td>
                    <td className={cn(td, 'text-ink-2')}>
                      {t(`types.${r.type}`)}
                    </td>
                    <td className={cn(td, 'text-ink-2')}>
                      {r.debit ? num(r.debit) : '—'}
                    </td>
                    <td className={cn(td, 'text-ink-2')}>
                      {r.credit ? num(r.credit) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {trial.rows.length > 0 && (
              <tfoot>
                <tr className="border-line bg-canvas border-t-2">
                  <td colSpan={3} className={cn(td, 'text-ink font-extrabold')}>
                    {t('trial.total')}
                  </td>
                  <td className={cn(td, 'text-ink font-extrabold')}>
                    {num(trial.totalDebit)}
                  </td>
                  <td className={cn(td, 'text-ink font-extrabold')}>
                    {num(trial.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="border-line text-muted space-y-1 border-t p-4 text-[11px]">
          <p>{t('trialTab.note')}</p>
          {trial.drafts > 0 && (
            <p>{t('trialTab.draftNote', { text: num(trial.drafts) })}</p>
          )}
        </div>
      </section>
    </div>
  );
}
