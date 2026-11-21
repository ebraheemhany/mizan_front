// component/dashbord/accounts/AccountsView.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  useClosePeriod,
  useDeleteAccount,
  useJournal,
  useLedgerAccounts,
  usePeriods,
  useTrialBalance,
  type JournalEntry,
  type LedgerAccount,
} from '@/lib/ledger/hooks';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import AccountDialog from './AccountDialog';
import ClosePeriodChecklist from './ClosePeriodChecklist';
import JournalTab from './JournalTab';
import { ManualEntrySheet } from './ManualEntrySheet';
import PeriodsCard from './PeriodsCard';
import TrialTab from './TrialTab';
import {
  card,
  cardTitle,
  downloadCsv,
  outlineBtn,
  td,
  th,
  useAccountName,
  useDay,
  useEntryText,
  useMonthLabel,
  useNum,
} from './ledger-ui';

const TABS = ['tree', 'journal', 'trial', 'close'] as const;
type Tab = (typeof TABS)[number];

export default function AccountsView() {
  const t = useTranslations('Accounts');
  const tErrors = useTranslations('ApiErrors');
  const user = useSession();

  if (!can(user.role, 'ledger')) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>
      </div>
    );
  }
  return <Books canReopen={can(user.role, 'reopenPeriods')} />;
}

function Books({ canReopen }: { canReopen: boolean }) {
  const t = useTranslations('Accounts');
  const money = useMoney();
  const num = useNum();
  const day = useDay();
  const monthLabel = useMonthLabel();
  const accountName = useAccountName();
  const entryText = useEntryText();
  const errorMessage = useApiErrorMessage();

  const accounts = useLedgerAccounts();
  const periods = usePeriods();
  const today = periods.data?.today;
  const currentMonth = today?.slice(0, 7) ?? '';
  const latest = useJournal({
    q: '',
    source: 'all',
    status: 'all',
    month: null,
    page: 1,
    pageSize: 4,
  });
  const monthTrial = useTrialBalance(currentMonth, {
    enabled: currentMonth !== '',
  });
  const allTrial = useTrialBalance('all');
  const closePeriod = useClosePeriod();
  const deleteAccount = useDeleteAccount();

  const [tab, setTab] = useState<Tab>('tree');
  const [confirmClose, setConfirmClose] = useState(false);
  // The manual entry sheet: open for a new entry (null) or an existing one.
  const [sheet, setSheet] = useState<{ entry: JournalEntry | null } | null>(
    null,
  );
  const [accountDialog, setAccountDialog] = useState<{
    account: LedgerAccount | null;
  } | null>(null);
  const [removing, setRemoving] = useState<LedgerAccount | null>(null);

  if (accounts.isPending || periods.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (accounts.isError || periods.isError) {
    return (
      <p className="text-danger py-14 text-center text-sm font-semibold">
        {errorMessage(accounts.error ?? periods.error)}
      </p>
    );
  }
  const chart = accounts.data;
  const books = periods.data;

  async function handleClose() {
    if (!books.toClose) return;
    const month = books.toClose;
    setConfirmClose(false);
    try {
      await closePeriod.mutateAsync(month);
      toast.success(t('close.closed', { month: monthLabel(month, false) }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleRemoveAccount() {
    if (!removing) return;
    const account = removing;
    setRemoving(null);
    try {
      await deleteAccount.mutateAsync(account.id);
      toast.success(t('accountDialog.removed'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const handleExport = () => {
    downloadCsv(
      'chart-of-accounts.csv',
      [t('tree.code'), t('tree.name'), t('tree.type'), t('tree.balance')],
      chart.map((a) => [
        a.code,
        accountName(a),
        t(`types.${a.type}`),
        a.balance.toFixed(2),
      ]),
    );
    toast.success(t('exported'));
  };

  const draftsToClose = books.open
    .filter(
      (m) => m.ended && books.toClose !== null && m.month <= books.toClose,
    )
    .reduce((s, m) => s + m.drafts, 0);
  // Closing with drafts left would fail: say so and show the checklist instead.
  const requestClose = () => {
    if (draftsToClose > 0) {
      toast.error(t('close.hasDrafts'));
      setTab('close');
      return;
    }
    setConfirmClose(true);
  };
  const periodsCard = (
    <PeriodsCard
      periods={books}
      canReopen={canReopen}
      onRequestClose={requestClose}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleExport} className={outlineBtn}>
              <Download className="size-4" />
              {t('export')}
            </button>
            <button
              type="button"
              onClick={() => setSheet({ entry: null })}
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
        <JournalTab
          months={allTrial.data?.months ?? []}
          closedThrough={books.closedThrough}
          canWrite
          onEdit={(entry) => setSheet({ entry })}
        />
      ) : tab === 'trial' ? (
        <TrialTab currentMonth={currentMonth} />
      ) : tab === 'close' ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ClosePeriodChecklist
            periods={books}
            onRequestClose={requestClose}
          />
          {periodsCard}
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* شجرة الحسابات */}
          <section className={card}>
            <div className="flex items-center justify-between gap-3 pe-5">
              <h2 className={cardTitle}>{t('tree.title')}</h2>
              <button
                type="button"
                onClick={() => setAccountDialog({ account: null })}
                className={cn(outlineBtn, 'h-9 px-3')}
              >
                <Plus className="size-4" />
                {t('tree.add')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] border-collapse">
                <thead>
                  <tr>
                    <th className={th}>{t('tree.code')}</th>
                    <th className={th}>{t('tree.name')}</th>
                    <th className={th}>{t('tree.type')}</th>
                    <th className={th}>{t('tree.balance')}</th>
                    <th className={cn(th, 'w-16')} />
                  </tr>
                </thead>
                <tbody>
                  {chart.map((a) => (
                    <tr key={a.id} className="border-line border-t">
                      <td className={cn(td, 'text-ink-2 tabular-nums')}>
                        {a.code}
                      </td>
                      <td className={cn(td, 'text-ink text-sm font-extrabold')}>
                        {accountName(a)}
                      </td>
                      <td className={cn(td, 'text-ink-2')}>
                        {t(`types.${a.type}`)}
                      </td>
                      <td
                        className={cn(
                          td,
                          'whitespace-nowrap tabular-nums',
                          a.balance < 0
                            ? 'text-danger'
                            : a.balance === 0
                              ? 'text-muted'
                              : 'text-ink-2',
                        )}
                      >
                        {money(a.balance)}
                      </td>
                      <td className="pe-3">
                        {!a.system && (
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              aria-label={t('tree.edit')}
                              title={t('tree.edit')}
                              onClick={() => setAccountDialog({ account: a })}
                              className="text-muted hover:bg-neutral-soft hover:text-ink rounded-lg p-1.5 transition-colors"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            {!a.used && (
                              <button
                                type="button"
                                aria-label={t('tree.remove')}
                                title={t('tree.remove')}
                                onClick={() => setRemoving(a)}
                                className="text-muted hover:bg-danger-soft hover:text-danger rounded-lg p-1.5 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* The other cards stack in one column (the chart is much taller). */}
          <div className="min-w-0 space-y-6">
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
                      <th className={th}>{t('entries.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(latest.data?.items ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-muted py-10 text-center text-xs"
                        >
                          {latest.isPending ? (
                            <Loader2 className="mx-auto size-4 animate-spin" />
                          ) : (
                            t('entries.empty')
                          )}
                        </td>
                      </tr>
                    ) : (
                      latest.data!.items.map((e) => (
                        <tr
                          key={`${e.source}:${e.id}`}
                          className="border-line border-t"
                        >
                          <td className={cn(td, 'text-brand font-bold')}>
                            <span dir="ltr" className="inline-block">
                              {e.ref ?? '—'}
                            </span>
                          </td>
                          <td
                            className={cn(td, 'text-ink-2 whitespace-nowrap')}
                          >
                            {day(e.date)}
                          </td>
                          <td className={cn(td, 'text-ink-2')}>
                            {entryText(e)}
                          </td>
                          <td className={cn(td, 'text-ink-2 tabular-nums')}>
                            {num(e.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ميزان المراجعة للشهر الحالي */}
            <section className={card}>
              <h2 className={cardTitle}>
                {t('trial.title', {
                  month: currentMonth ? monthLabel(currentMonth, false) : '',
                })}
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
                    {(monthTrial.data?.rows ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-muted py-10 text-center text-xs"
                        >
                          {monthTrial.isPending ? (
                            <Loader2 className="mx-auto size-4 animate-spin" />
                          ) : (
                            t('trialTab.empty')
                          )}
                        </td>
                      </tr>
                    ) : (
                      monthTrial.data!.rows.map((r) => (
                        <tr key={r.account.id} className="border-line border-t">
                          <td className={cn(td, 'text-ink')}>
                            {accountName(r.account)}
                          </td>
                          <td className={cn(td, 'text-ink-2 tabular-nums')}>
                            {r.debit ? num(r.debit) : '—'}
                          </td>
                          <td className={cn(td, 'text-ink-2 tabular-nums')}>
                            {r.credit ? num(r.credit) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthTrial.data && monthTrial.data.rows.length > 0 && (
                    <tfoot>
                      <tr className="border-line bg-canvas border-t-2">
                        <td className={cn(td, 'text-ink font-extrabold')}>
                          {t('trial.total')}
                        </td>
                        <td
                          className={cn(
                            td,
                            'text-ink font-extrabold tabular-nums',
                          )}
                        >
                          {num(monthTrial.data.totalDebit)}
                        </td>
                        <td
                          className={cn(
                            td,
                            'text-ink font-extrabold tabular-nums',
                          )}
                        >
                          {num(monthTrial.data.totalCredit)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>

            {/* إقفال الفترات */}
            {periodsCard}
          </div>
        </div>
      )}

      {books.toClose && (
        <ConfirmDialog
          open={confirmClose}
          title={t('close.confirmTitle', {
            month: monthLabel(books.toClose, false),
          })}
          description={t('close.confirmDescription')}
          cancelLabel={t('close.cancel')}
          confirmLabel={t('close.confirm')}
          onConfirm={handleClose}
          onClose={() => setConfirmClose(false)}
        />
      )}

      <ConfirmDialog
        open={removing !== null}
        title={t('accountDialog.removeTitle', {
          name: removing ? accountName(removing) : '',
        })}
        description={t('accountDialog.removeDescription')}
        cancelLabel={t('close.cancel')}
        confirmLabel={t('tree.remove')}
        onConfirm={handleRemoveAccount}
        onClose={() => setRemoving(null)}
      />

      {sheet && (
        <ManualEntrySheet
          key={sheet.entry?.id ?? 'new'}
          open
          onClose={() => setSheet(null)}
          entry={sheet.entry}
          accounts={chart}
          closedThrough={books.closedThrough}
        />
      )}

      <AccountDialog
        open={accountDialog !== null}
        account={accountDialog?.account ?? null}
        onClose={() => setAccountDialog(null)}
      />
    </div>
  );
}
