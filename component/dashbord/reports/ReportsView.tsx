// component/dashbord/reports/ReportsView.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, ChevronDown, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useCustomers } from '@/lib/customers/hooks';
import { downloadCsv } from '@/lib/export-csv';
import { useMoney } from '@/lib/money';
import { printWithTitle } from '@/lib/print';
import {
  AGING_BUCKETS,
  useCustomerStatement,
  useReportAging,
  useReportSummary,
  useReportVat,
  type ReportPeriod,
  type ReportSummary,
} from '@/lib/reports/hooks';
import { cn } from '@/lib/utils';
import AgingCard from './AgingCard';
import AgingTab from './AgingTab';
import LedgerComingSoon from './LedgerComingSoon';
import PnlStatement from './PnlStatement';
import { outlineBtn, WithReport } from './ReportState';
import ReportsPrintSheet from './ReportsPrintSheet';
import ReportsTabs from './ReportsTabs';
import RevenueExpensesChart from './RevenueExpensesChart';
import { STATEMENT_CUSTOMERS } from './StatementCustomerPicker';
import StatementTab, { type StatementCustomer } from './StatementTab';
import TopCustomersTable from './TopCustomersTable';
import {
  deviceCairoMonth,
  LEDGER_TABS,
  monthToDate,
  parseReportsSearch,
  PERIOD_KEYWORDS,
  recentMonths,
  REPORT_TABS,
  reportsSearch,
  type ReportsUrlState,
  type ReportTab,
} from './utils';
import VatCard from './VatCard';
import VatTab from './VatTab';

const MENU_MONTHS = 12;

type CsvRow = (string | number | null)[];

/**
 * Puts the report's state in the URL without a navigation. Next keeps useSearchParams
 * in step with history.replaceState, so the page re-renders from the new URL.
 */
function replaceSearch(search: string) {
  window.history.replaceState(null, '', search ? `${window.location.pathname}?${search}` : window.location.pathname);
}

/** Reports are for the roles with the "reports" permission (owner + accountant). */
export default function ReportsView() {
  const user = useSession();
  const tErrors = useTranslations('ApiErrors');
  if (!can(user.role, 'reports')) {
    return <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>;
  }
  return <ReportsContent />;
}

function ReportsContent() {
  const t = useTranslations('Reports');
  const tApi = useTranslations('ReportsApi');
  const tStatus = useTranslations('Payments.status');
  const format = useFormatter();
  const money = useMoney();
  const errorMessage = useApiErrorMessage();

  // The URL (?tab=&period=&customer=) is the only source of the page's state: a link
  // such as a customer's "Statement" button always opens what it says, even when Next
  // brings back a reports page that was kept alive in the background.
  const searchParams = useSearchParams();
  const url = parseReportsSearch(Object.fromEntries(searchParams.entries()));
  const { tab, period } = url;
  const setUrl = (patch: Partial<ReportsUrlState>) => replaceSearch(reportsSearch({ ...url, ...patch }));
  const setTab = (next: ReportTab) => setUrl({ tab: next });
  const setPeriod = (next: ReportPeriod | null) => setUrl({ period: next });

  // The URL only carries the customer's id; remember the names picked here for the header.
  const [pickedNames, setPickedNames] = useState<Record<string, string>>({});
  const picked = url.customer ? { id: url.customer, name: pickedNames[url.customer] ?? null } : null;
  const pickCustomer = (customer: { id: string; name: string }) => {
    setPickedNames((names) => ({ ...names, [customer.id]: customer.name }));
    setUrl({ customer: customer.id });
  };
  const [deviceMonth] = useState(deviceCairoMonth);

  const summaryQuery = useReportSummary(period);
  const agingQuery = useReportAging({ enabled: tab === 'pnl' || tab === 'aging' });
  const vatQuery = useReportVat(period, { enabled: tab === 'pnl' || tab === 'vat' });

  // Statement: the picked customer, else the one with the largest balance.
  const onStatement = tab === 'statement';
  const firstCustomers = useCustomers(STATEMENT_CUSTOMERS, { enabled: onStatement && !picked });
  const first = firstCustomers.data?.items[0];
  const statementCustomer: StatementCustomer = picked
    ? { status: 'ready', ...picked }
    : first
      ? { status: 'ready', id: first.id, name: first.name }
      : firstCustomers.isError
        ? { status: 'error', error: firstCustomers.error, retry: () => void firstCustomers.refetch() }
        : firstCustomers.data
          ? { status: 'none' }
          : { status: 'loading' };
  const statementQuery = useCustomerStatement(
    onStatement && statementCustomer.status === 'ready' ? statementCustomer.id : null,
    period,
  );

  // A month after the current one (a hand-edited URL) is refused by the API: show this month.
  const periodRefused =
    period !== null && summaryQuery.error instanceof ApiError && summaryQuery.error.code === 'VALIDATION_ERROR';
  const { customer: urlCustomer } = url;
  useEffect(() => {
    if (periodRefused) replaceSearch(reportsSearch({ tab, period: null, customer: urlCustomer }));
  }, [periodRefused, tab, urlCustomer]);

  // The business month comes from the server (Cairo); the device's is a stand-in until then.
  const currentMonth =
    summaryQuery.data?.currentMonth ??
    vatQuery.data?.currentMonth ??
    statementQuery.data?.currentMonth ??
    deviceMonth;
  const selected = period ?? currentMonth;

  const monthYear = (ym: string) =>
    format.dateTime(monthToDate(ym), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });
  const quarterText = (ym: string) =>
    t('quarterLabel', { q: Math.ceil(Number(ym.slice(5, 7)) / 3), year: ym.slice(0, 4) });

  // Calendar quarter/year containing the current month, or the chosen month.
  const periodText =
    selected === 'thisQuarter'
      ? quarterText(currentMonth)
      : selected === 'thisYear'
        ? currentMonth.slice(0, 4)
        : monthYear(selected);

  const selectedPeriodLabel =
    selected === 'thisQuarter' || selected === 'thisYear'
      ? t(`periods.${selected}`)
      : periodText;

  // The previous period of the same kind: last month, last quarter or last year.
  const previousText = (s: ReportSummary) => {
    const month = s.previous.start.slice(0, 7);
    if (s.period.key === 'thisQuarter') return quarterText(month);
    if (s.period.key === 'thisYear') return month.slice(0, 4);
    return format.dateTime(monthToDate(month), { month: 'long', timeZone: 'UTC' });
  };

  const pct = (value: number, signed = false) =>
    format.number(value / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
      ...(signed ? { signDisplay: 'always' as const } : {}),
    });

  const vsPrevious = (s: ReportSummary, change: number | null) =>
    change === null
      ? tApi('noComparison')
      : t('stats.revenueHint', { pct: pct(change, true), month: previousText(s) });

  const choosePeriod = (next: ReportPeriod) =>
    setPeriod(next === currentMonth ? null : next);

  const tabs = REPORT_TABS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
  }));

  const s = summaryQuery.data;

  const statCards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t('stats.revenue')}
        value={s ? money(s.revenue) : '—'}
        hint={s ? vsPrevious(s, s.change.revenue) : ''}
        hintTone="brand"
      />
      <StatCard
        label={t('stats.expenses')}
        value={s ? money(s.expenses) : '—'}
        hint={s ? vsPrevious(s, s.change.expenses) : ''}
      />
      <StatCard
        label={t('stats.netProfit')}
        value={s ? money(s.netProfit) : '—'}
        hint={
          !s
            ? ''
            : s.marginPct === null
              ? tApi('noRevenue')
              : t('stats.margin', { pct: pct(s.marginPct) })
        }
        tone={s && s.netProfit < 0 ? 'danger' : 'brand'}
        hintTone="default"
      />
      <StatCard
        label={tApi('collected')}
        value={s ? money(s.collected) : '—'}
        hint={tApi('collectedHint')}
      />
    </div>
  );

  const reportContent =
    tab === 'pnl' ? (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WithReport query={summaryQuery}>
          {(data) => <RevenueExpensesChart series={data.series} />}
        </WithReport>
        <WithReport query={summaryQuery}>
          {(data) => <PnlStatement summary={data} />}
        </WithReport>
        <WithReport query={agingQuery}>
          {(data) => <AgingCard buckets={data.buckets} />}
        </WithReport>
        <WithReport query={vatQuery}>{(data) => <VatCard vat={data} />}</WithReport>
        <WithReport query={summaryQuery} className="lg:col-span-2">
          {(data) => (
            <TopCustomersTable
              customers={data.topCustomers}
              totalRevenue={data.revenue}
            />
          )}
        </WithReport>
      </div>
    ) : LEDGER_TABS.includes(tab) ? (
      <LedgerComingSoon />
    ) : tab === 'aging' ? (
      <WithReport query={agingQuery}>{(data) => <AgingTab aging={data} />}</WithReport>
    ) : tab === 'vat' ? (
      <WithReport query={vatQuery}>{(data) => <VatTab vat={data} />}</WithReport>
    ) : (
      <StatementTab
        customer={statementCustomer}
        query={statementQuery}
        onCustomerChange={pickCustomer}
      />
    );

  /** The current tab as CSV rows, or null while its data isn't loaded (or there is none yet). */
  function exportRows(): CsvRow[] | null {
    const aging = agingQuery.data;
    const vat = vatQuery.data;
    const statement = statementQuery.data;
    const columns = (...keys: string[]) => keys.map((key) => t(`export.columns.${key}`));

    if (tab === 'pnl') {
      if (!s || !aging || !vat) return null;
      const row = (section: string, item: string, amount: number): CsvRow => [section, item, amount, null, null, null];
      return [
        columns('section', 'item', 'amount', 'revenue', 'expenses', 'invoices'),
        row(t('stats.revenue'), '', s.revenue),
        row(t('stats.expenses'), '', s.expenses),
        row(t('stats.netProfit'), '', s.netProfit),
        row(tApi('collected'), '', s.collected),
        ...s.lines.map((line) =>
          row(t('pnl.title'), t(`pnl.lines.${line.key}`), line.kind === 'income' ? line.amount : -line.amount || 0),
        ),
        row(t('pnl.title'), t('pnl.lines.grossProfit'), s.grossProfit),
        row(t('pnl.title'), t('pnl.lines.netProfit'), s.netProfit),
        ...s.series.map((point): CsvRow => [
          t('chart.title'),
          monthYear(point.month),
          null,
          point.revenue,
          point.expenses,
          null,
        ]),
        ...aging.rows.flatMap((customer) =>
          AGING_BUCKETS.map((bucket) =>
            row(t('agingTab.table.title'), `${customer.name} - ${t(`aging.buckets.${bucket}`)}`, customer[bucket]),
          ),
        ),
        row(t('vat.title'), t('vat.output'), vat.output),
        row(t('vat.title'), t('vat.input'), vat.input),
        row(t('vat.title'), t('vat.due'), vat.due),
        ...s.topCustomers.map((customer): CsvRow => [
          t('topCustomers.title'),
          customer.name,
          customer.revenue,
          null,
          null,
          customer.invoicesCount,
        ]),
      ];
    }

    if (tab === 'aging') {
      if (!aging) return null;
      return [
        [
          t('agingTab.table.customer'),
          ...AGING_BUCKETS.map((bucket) => t(`aging.buckets.${bucket}`)),
          t('agingTab.table.total'),
        ],
        ...aging.rows.map((customer): CsvRow => [
          customer.name,
          ...AGING_BUCKETS.map((bucket) => customer[bucket]),
          customer.total,
        ]),
        [
          t('agingTab.table.total'),
          ...AGING_BUCKETS.map((bucket) => aging.buckets.find((b) => b.key === bucket)?.amount ?? 0),
          aging.total,
        ],
      ];
    }

    if (tab === 'vat') {
      if (!vat) return null;
      return [
        columns('item', 'amount'),
        [t('vat.output'), vat.output],
        [t('vat.input'), vat.input],
        [t('vat.due'), vat.due],
        [t('vatTab.details.rate'), `${vat.rate}%`],
        [t('vatTab.details.taxableSales'), vat.taxableSales],
        [tApi('exemptSales'), vat.exemptSales],
        [tApi('invoicesCount'), vat.invoicesCount],
        [t('vat.dueDate'), vat.filingDueDate],
      ];
    }

    if (tab === 'statement') {
      if (!statement) return null;
      return [
        [t('statementTab.customer'), statement.customer.name],
        [],
        [
          t('statementTab.table.date'),
          t('statementTab.table.description'),
          t('export.columns.reference'),
          t('statementTab.table.debit'),
          t('statementTab.table.credit'),
          t('statementTab.table.balance'),
        ],
        ['', t('statementTab.table.opening'), '', null, null, statement.opening],
        ...statement.txns.map((txn): CsvRow => [
          txn.date,
          [
            t(`statementTab.table.types.${txn.type}`),
            txn.invoiceRef && tApi('onInvoice', { ref: txn.invoiceRef }),
            txn.pending && `(${tStatus('pending')})`,
          ]
            .filter(Boolean)
            .join(' '),
          txn.ref,
          txn.type === 'invoice' ? txn.amount : null,
          txn.type === 'payment' ? txn.amount : null,
          txn.balance,
        ]),
        ['', t('statementTab.table.closing'), '', statement.invoiced, statement.paid, statement.closing],
      ];
    }

    // Balance sheet and cash flow: nothing real to export until the ledger exists.
    return null;
  }

  // What each tab's export needs; balance sheet and cash flow have nothing real yet.
  const exportReady: Record<ReportTab, boolean> = {
    pnl: !!(s && agingQuery.data && vatQuery.data),
    balanceSheet: false,
    cashFlow: false,
    aging: !!agingQuery.data,
    vat: !!vatQuery.data,
    statement: !!statementQuery.data,
  };

  function downloadExcel() {
    const rows = exportRows();
    if (!rows) return;
    // Aging is as of today, whatever the period.
    const when = tab === 'aging' && agingQuery.data ? agingQuery.data.asOf : periodText;
    downloadCsv(`Reports-${selected}-${tab}.csv`, [[t('title')], [t(`tabs.${tab}`), when], [], ...rows]);
    toast.success(t('toasts.excelDownloaded'));
  }

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title={t('title')}
          description={`${periodText} · ${t('basis')}`}
          actions={
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  aria-label={t('periodLabel')}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    outlineBtn,
                  )}
                >
                  <span className="max-w-44 truncate">{selectedPeriodLabel}</span>
                  <ChevronDown className="size-4 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-[min(28rem,70vh)] w-60 overflow-y-auto rounded-card border-line bg-surface p-2 shadow-float"
                >
                  <div className="text-muted px-3 py-2 text-[10px] font-extrabold tracking-wide uppercase">
                    {t('filter.quickPeriods')}
                  </div>
                  {PERIOD_KEYWORDS.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => choosePeriod(p)}
                      className="text-ink-2 h-10 justify-between rounded-btn px-3 text-xs font-semibold data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                    >
                      {t(`periods.${p}`)}
                      {p === selected && (
                        <Check className="text-brand size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="my-2" />
                  <div className="text-muted px-3 py-2 text-[10px] font-extrabold tracking-wide uppercase">
                    {t('filter.months')}
                  </div>
                  {recentMonths(currentMonth, MENU_MONTHS).map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onClick={() => choosePeriod(month)}
                      className="text-ink-2 h-10 justify-between rounded-btn px-3 text-xs font-semibold data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                    >
                      {monthYear(month)}
                      {month === selected && (
                        <Check className="text-brand size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
                onClick={() => printWithTitle(`Reports-${selected}-${tab}`)}
              >
                <Download className="size-4" />
                {t('actions.pdf')}
              </button>

              <button
                type="button"
                className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
                disabled={!exportReady[tab]}
                onClick={downloadExcel}
              >
                <FileSpreadsheet className="size-4" />
                {t('actions.excel')}
              </button>
            </>
          }
        />

        <ReportsTabs value={tab} tabs={tabs} onChange={setTab} />

        {tab === 'pnl' && summaryQuery.isError && !s && (
          <div className="rounded-card border-line bg-surface flex flex-wrap items-center justify-between gap-3 border px-4 py-3 shadow-sm">
            <p className="text-danger text-sm font-semibold">{errorMessage(summaryQuery.error)}</p>
            <Button variant="outline" className={outlineBtn} onClick={() => summaryQuery.refetch()}>
              {tApi('retry')}
            </Button>
          </div>
        )}

        {/* The company's own P&L cards belong to the P&L only: a printed customer
            statement must not show the company's revenue and profit. */}
        {tab === 'pnl' && statCards}
        {reportContent}
      </div>

      <ReportsPrintSheet
        title={t('title')}
        period={periodText}
        basis={t('basis')}
        tab={tabs.find((item) => item.value === tab)?.label ?? ''}
      >
        {tab === 'pnl' && statCards}
        {reportContent}
      </ReportsPrintSheet>
    </>
  );
}
