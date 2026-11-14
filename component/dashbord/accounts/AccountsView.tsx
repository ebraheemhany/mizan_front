// component/dashbord/accounts/AccountsView.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import {
  ACCOUNTS,
  ACCOUNTS_MONTH,
  ACCOUNTS_TODAY,
  JOURNAL,
  entryTotals,
  PERIODS,
  type EntryDesc,
  type FiscalPeriod,
  type JournalEntry,
  type PeriodStatus,
} from '@/lib/mock/accounts';
import PageHeader from '@/component/PageHeader';
import ConfirmDialog from '@/component/ConfirmDialog';
import JournalTab from './JournalTab';
import { ManualEntrySheet } from './ManualEntrySheet';
import TrialTab from './TrialTab';
import ClosePeriodChecklist from './ClosePeriodChecklist';
import { computeTrial } from '@/lib/trial-balance';

const TABS = ['tree', 'journal', 'trial', 'close'] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLES: Record<PeriodStatus, string> = {
  closed: 'bg-brand-soft text-brand-deep',
  open: 'bg-info-soft text-info',
  running: 'bg-neutral-soft text-ink-2',
};

const card = 'rounded-card border-line bg-surface border shadow-sm';
const cardTitle = 'text-ink px-5 pt-5 pb-3 text-base font-extrabold';
const th =
  'bg-canvas text-muted px-4 py-3 text-start text-xs font-bold whitespace-nowrap';
const td = 'px-4 py-3.5 text-xs';

export default function AccountsView() {
  const t = useTranslations('Accounts');
  const format = useFormatter();
  const money = useMoney();

  const [tab, setTab] = useState<Tab>('tree');
  const [periods, setPeriods] = useState<FiscalPeriod[]>(PERIODS);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [journal, setJournal] = useState<JournalEntry[]>(JOURNAL);
  const [manualOpen, setManualOpen] = useState(false);

  const num = (n: number) => format.number(n, { numberingSystem: 'latn' });

  const nextNumber = `JE-${String(
    Math.max(...journal.map((e) => Number(e.number.slice(3)))) + 1,
  ).padStart(4, '0')}`;

  // أي تاريخ في شهر مقفول أو قبله ما يقبلش قيود، علشان ما يتعملش قيد بتاريخ قديم يغيّر أرصدة اتقفلت
  const isClosed = (date: string) =>
    periods.some(
      (p) =>
        p.kind === 'month' &&
        p.status === 'closed' &&
        date.slice(0, 7) <= p.id,
    );

  const addEntry = (entry: JournalEntry) =>
    setJournal((prev) =>
      [...prev, entry].sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.number.localeCompare(a.number),
      ),
    );

  // القيود المسودة في فترة (yyyy-mm)
  const draftsIn = (id: string) =>
    journal.filter((e) => e.status === 'draft' && e.date.startsWith(id)).length;

  const postDrafts = (id: string) => {
    // TODO: ترحيل المسودات من الـ API
    const count = draftsIn(id);
    setJournal((prev) =>
      prev.map((e) =>
        e.status === 'draft' && e.date.startsWith(id)
          ? { ...e, status: 'posted' }
          : e,
      ),
    );
    toast.success(t('closeTab.posted', { text: num(count) }));
  };

  const fmtDay = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  const fmtFullDate = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  const fmtMonth = (iso: string) =>
    format.dateTime(new Date(iso), { month: 'long', timeZone: 'UTC' });

  const fmtMonthYear = (iso: string) =>
    format.dateTime(new Date(iso), {
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  const entryText = (d: EntryDesc) =>
    t(`entries.${d.key}`, {
      ref: d.ref ?? '',
      month: d.month ? fmtMonth(d.month) : '',
      text: d.text ?? '',
    });

  const unpostedText = (count: number) =>
    t('close.unposted', { count, text: num(count) });

  const periodTitle = (p: FiscalPeriod) =>
    p.kind === 'year'
      ? t('close.fiscalYear', {
          year: String(new Date(p.date).getUTCFullYear()),
        })
      : fmtMonthYear(p.date);

  const periodHint = (p: FiscalPeriod) => {
    if (p.status === 'closed' && p.closedAt)
      return t('close.hints.closed', { date: fmtDay(p.closedAt) });
    if (p.status === 'open')
      return t('close.hints.open', { unposted: unpostedText(draftsIn(p.id)) });
    if (p.endsAt) return t('close.hints.year', { date: fmtFullDate(p.endsAt) });
    return '';
  };

  const openPeriod = periods.find(
    (p) => p.kind === 'month' && p.status === 'open',
  );

  // المسودات بتمنع الإقفال
  const requestClose = () => {
    if (openPeriod && draftsIn(openPeriod.id) > 0) {
      toast.error(t('close.hasDrafts'));
      return;
    }
    setConfirmOpen(true);
  };

  const handleClosePeriod = () => {
    if (!openPeriod) return;
    // TODO: إقفال الفترة من الـ API
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === openPeriod.id
          ? {
              ...p,
              status: 'closed',
              closedAt: ACCOUNTS_TODAY,
              unposted: undefined,
            }
          : p,
      ),
    );
    toast.success(t('close.closed', { month: fmtMonth(openPeriod.date) }));
    setConfirmOpen(false);
  };

  // TODO: بدّله بـ lib/export-csv.ts لو شكله مناسب
  const handleExport = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      t('tree.code'),
      t('tree.name'),
      t('tree.type'),
      t('tree.balance'),
    ];
    const lines = ACCOUNTS.map((a) =>
      [a.code, t(`names.${a.key}`), t(`types.${a.type}`), String(a.balance)]
        .map(cell)
        .join(','),
    );
    const csv = '\uFEFF' + [header.map(cell).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-of-accounts.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('exported'));
  };

  // نفس حساب تاب الميزان، علشان الكارت ما يختلفش عنه بعد أي قيد يدوي
  const overviewTrial = computeTrial(journal, ACCOUNTS_MONTH.slice(0, 7));

  // كارت إقفال الفترات (بيتعرض في تاب الشجرة وتاب الإقفال)
  const periodsCard = (
    <section className={card}>
      <h2 className={cardTitle}>{t('close.title')}</h2>
      <div className="divide-line divide-y px-5">
        {periods.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0 text-start">
              <p className="text-ink text-sm font-extrabold">
                {periodTitle(p)}
              </p>
              <p className="text-muted mt-0.5 text-[11px]">{periodHint(p)}</p>
            </div>
            <span
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                STATUS_STYLES[p.status],
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {t(`close.status.${p.status}`)}
            </span>
          </div>
        ))}
      </div>

      {openPeriod && (
        <div className="p-5 pt-4">
          <button
            type="button"
            onClick={requestClose}
            className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn h-10 border px-4 text-xs font-bold transition-colors"
          >
            {t('close.closeButton', { month: fmtMonth(openPeriod.date) })}
          </button>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn flex h-10 items-center gap-2 border px-4 text-xs font-bold transition-colors"
            >
              <Download className="size-4" />
              {t('export')}
            </button>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="bg-brand hover:bg-brand-deep rounded-btn flex h-10 items-center gap-2 px-4 text-xs font-bold text-white transition-colors"
            >
              <Plus className="size-4" />
              {t('manualEntry')}
            </button>
          </div>
        }
      />

      <div
        role="tablist"
        // الخط اللي تحت التابات shadow مش border، علشان -mb-px كان بيعمل overflow رأسي ويطلّع scrollbar
        className="flex gap-6 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-line)]"
      >
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-bold whitespace-nowrap transition-colors',
              tab === id
                ? 'border-brand text-brand'
                : 'text-muted hover:text-ink border-transparent',
            )}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'journal' ? (
        <JournalTab entries={journal} />
      ) : tab === 'trial' ? (
        <TrialTab entries={journal} />
      ) : tab === 'close' ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ClosePeriodChecklist
            period={openPeriod}
            periods={periods}
            entries={journal}
            monthLabel={openPeriod ? fmtMonth(openPeriod.date) : ''}
            unpostedText={unpostedText}
            onPostDrafts={postDrafts}
            onRequestClose={requestClose}
          />
          {periodsCard}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* شجرة الحسابات */}
          <section className={card}>
            <h2 className={cardTitle}>{t('tree.title')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{t('tree.code')}</th>
                    <th className={th}>{t('tree.name')}</th>
                    <th className={th}>{t('tree.type')}</th>
                    <th className={th}>{t('tree.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ACCOUNTS.map((a) => (
                    <tr key={a.code} className="border-line border-t">
                      <td className={cn(td, 'text-ink-2')}>{a.code}</td>
                      <td className={cn(td, 'text-ink text-sm font-extrabold')}>
                        {t(`names.${a.key}`)}
                      </td>
                      <td className={cn(td, 'text-ink-2')}>
                        {t(`types.${a.type}`)}
                      </td>
                      <td className={cn(td, 'text-ink-2 whitespace-nowrap')}>
                        {money(a.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* آخر القيود */}
          <section className={card}>
            <h2 className={cardTitle}>{t('entries.title')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{t('entries.number')}</th>
                    <th className={th}>{t('entries.date')}</th>
                    <th className={th}>{t('entries.description')}</th>
                    <th className={th}>{t('entries.debit')}</th>
                    <th className={th}>{t('entries.credit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.slice(0, 4).map((e) => {
                    const { debit, credit } = entryTotals(e);
                    return (
                      <tr key={e.id} className="border-line border-t">
                        <td className={cn(td, 'text-brand font-bold')}>
                          <span dir="ltr" className="inline-block">
                            {e.number}
                          </span>
                        </td>
                        <td className={cn(td, 'text-ink-2 whitespace-nowrap')}>
                          {fmtDay(e.date)}
                        </td>
                        <td className={cn(td, 'text-ink-2')}>
                          {entryText(e.desc)}
                        </td>
                        <td className={cn(td, 'text-ink-2')}>{num(debit)}</td>
                        <td className={cn(td, 'text-ink-2')}>{num(credit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ميزان المراجعة */}
          <section className={card}>
            <h2 className={cardTitle}>
              {t('trial.title', { month: fmtMonth(ACCOUNTS_MONTH) })}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{t('trial.account')}</th>
                    <th className={th}>{t('trial.debit')}</th>
                    <th className={th}>{t('trial.credit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewTrial.rows.map((r) => (
                    <tr key={r.key} className="border-line border-t">
                      <td className={cn(td, 'text-ink')}>
                        {t(`names.${r.key}`)}
                      </td>
                      <td className={cn(td, 'text-ink-2')}>
                        {r.debit ? num(r.debit) : '—'}
                      </td>
                      <td className={cn(td, 'text-ink-2')}>
                        {r.credit ? num(r.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-line bg-canvas border-t-2">
                    <td className={cn(td, 'text-ink font-extrabold')}>
                      {t('trial.total')}
                    </td>
                    <td className={cn(td, 'text-ink font-extrabold')}>
                      {num(overviewTrial.totalDebit)}
                    </td>
                    <td className={cn(td, 'text-ink font-extrabold')}>
                      {num(overviewTrial.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* إقفال الفترات */}
          {periodsCard}
        </div>
      )}

      {openPeriod && (
        <ConfirmDialog
          open={confirmOpen}
          title={t('close.confirmTitle', { month: fmtMonth(openPeriod.date) })}
          description={t('close.confirmDescription')}
          cancelLabel={t('close.cancel')}
          confirmLabel={t('close.confirm')}
          onConfirm={handleClosePeriod}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      <ManualEntrySheet
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        nextNumber={nextNumber}
        isClosed={isClosed}
        onCreate={addEntry}
      />
    </div>
  );
}
