// component/dashbord/reports/ReportsView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, ChevronDown, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { printWithTitle } from '@/lib/print';
import { downloadCsv } from '@/lib/export-csv';
import {
  agingBuckets,
  agingRows,
  balanceSheetInputs,
  cashBalance,
  cashFlowInputs,
  CURRENT_MONTH,
  pnlLines,
  customerStatements,
  VAT_RATE,
  vatSummary,
  topCustomers,
  type ReportPeriod,
} from '@/lib/mock/reports';
import PnlStatement from './PnlStatement';
import ReportsTabs from './ReportsTabs';
import RevenueExpensesChart from './RevenueExpensesChart';
import {
  buildSeries,
  changePct,
  computeBalanceSheet,
  computeCashFlow,
  computePnl,
  computeStatement,
  monthToDate,
} from './utils';
import { useReportMoney } from './useReportMoney';
import TopCustomersTable from './TopCustomersTable';
import AgingCard from './AgingCard';
import VatCard from './VatCard';
import BalanceSheetTab from './BalanceSheetTab';
import CashFlowTab from './CashFlowTab';
import AgingTab from './AgingTab';
import VatTab from './VatTab';
import StatementTab from './StatementTab';
import ReportsPrintSheet from './ReportsPrintSheet';

type TabKey =
  'pnl' | 'balanceSheet' | 'cashFlow' | 'aging' | 'vat' | 'statement';

const TAB_KEYS: TabKey[] = [
  'pnl',
  'balanceSheet',
  'cashFlow',
  'aging',
  'vat',
  'statement',
];

const PERIODS = [
  'thisQuarter',
  'thisYear',
] as const;

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

// كله بيتحسب من قائمة الأرباح والخسائر
// TODO: لما نربط الـ API الأرقام دي بتتغير حسب الفترة
const PNL = computePnl(pnlLines);
const SERIES = buildSeries(pnlLines);
const PREV = SERIES[SERIES.length - 2];

export default function ReportsView() {
  const t = useTranslations('Reports');
  const format = useFormatter();
  const money = useReportMoney();

  // TODO: لما نربط الـ API الفترة والتاب هيتبعتوا كـ query params
  const [period, setPeriod] = useState<ReportPeriod>(CURRENT_MONTH);
  const [tab, setTab] = useState<TabKey>('pnl');
  const [statementCustomerId, setStatementCustomerId] = useState(
    customerStatements[0].id,
  );

  const monthYear = (date: Date) =>
    format.dateTime(date, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  const periodText = useMemo(() => {
    const current = monthToDate(CURRENT_MONTH);
    switch (period) {
      case 'thisQuarter':
        return t('quarterLabel', {
          q: Math.ceil((current.getUTCMonth() + 1) / 3),
          year: String(current.getUTCFullYear()),
        });
      case 'thisYear':
        return String(current.getUTCFullYear());
      default:
        return monthYear(monthToDate(period));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, t]);

  const pct = (value: number, signed = false) =>
    format.number(value / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
      ...(signed ? { signDisplay: 'always' as const } : {}),
    });

  const prevMonthName = format.dateTime(monthToDate(PREV.month), {
    month: 'long',
    timeZone: 'UTC',
  });

  const tabs = TAB_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
  }));

  const reportContent =
    tab === 'pnl' ? (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueExpensesChart series={SERIES} />
        <PnlStatement lines={pnlLines} />
        <AgingCard buckets={agingBuckets} />
        <VatCard vat={vatSummary} />
        <TopCustomersTable
          customers={topCustomers}
          totalRevenue={PNL.revenue}
        />
      </div>
    ) : tab === 'balanceSheet' ? (
      <BalanceSheetTab netProfit={PNL.netProfit} />
    ) : tab === 'cashFlow' ? (
      <CashFlowTab netProfit={PNL.netProfit} />
    ) : tab === 'aging' ? (
      <AgingTab />
    ) : tab === 'vat' ? (
      <VatTab />
    ) : (
      <StatementTab
        customerId={statementCustomerId}
        onCustomerChange={setStatementCustomerId}
      />
    );

  const statCards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t('stats.revenue')}
        value={money(PNL.revenue)}
        hint={t('stats.revenueHint', {
          pct: pct(changePct(PNL.revenue, PREV.revenue), true),
          month: prevMonthName,
        })}
        hintTone="brand"
      />
      <StatCard
        label={t('stats.expenses')}
        value={money(PNL.expenses)}
        hint={pct(changePct(PNL.expenses, PREV.expenses), true)}
      />
      <StatCard
        label={t('stats.netProfit')}
        value={money(PNL.netProfit)}
        hint={t('stats.margin', { pct: pct(PNL.marginPct) })}
        tone="brand"
        hintTone="default"
      />
      <StatCard
        label={t('stats.cashBalance')}
        value={money(cashBalance)}
        hint={t('stats.cashHint')}
      />
    </div>
  );

  const selectedPeriodLabel =
    period === 'thisQuarter' || period === 'thisYear'
      ? t(`periods.${period}`)
      : periodText;

  function downloadExcel() {
    const rows: (string | number | null)[][] = [
      [t('title')],
      [t(`tabs.${tab}`), periodText],
      [],
    ];

    if (tab === 'pnl') {
      rows.push([
        t('export.columns.section'),
        t('export.columns.item'),
        t('export.columns.amount'),
        t('export.columns.revenue'),
        t('export.columns.expenses'),
        t('export.columns.invoices'),
      ]);
      rows.push(
        [
          t('stats.revenue'),
          '',
          PNL.revenue,
          null,
          null,
          null,
        ],
        [
          t('stats.expenses'),
          '',
          PNL.expenses,
          null,
          null,
          null,
        ],
        [
          t('stats.netProfit'),
          '',
          PNL.netProfit,
          null,
          null,
          null,
        ],
        [
          t('stats.cashBalance'),
          '',
          cashBalance,
          null,
          null,
          null,
        ],
        ...pnlLines.map((line) => [
          t('pnl.title'),
          t(`pnl.lines.${line.key}`),
          line.kind === 'income' ? line.amount : -line.amount,
          null,
          null,
          null,
        ]),
        [
          t('pnl.title'),
          t('pnl.lines.grossProfit'),
          PNL.grossProfit,
          null,
          null,
          null,
        ],
        [
          t('pnl.title'),
          t('pnl.lines.netProfit'),
          PNL.netProfit,
          null,
          null,
          null,
        ],
        ...SERIES.map((point) => [
          t('chart.title'),
          monthYear(monthToDate(point.month)),
          null,
          point.revenue,
          point.expenses,
          null,
        ]),
        ...agingRows.flatMap((customer) =>
          (['notDue', 'd1_30', 'd31_60', 'd60plus'] as const).map(
            (bucket) => [
              t('agingTab.table.title'),
              `${customer.name} - ${t(`aging.buckets.${bucket}`)}`,
              customer[bucket],
              null,
              null,
              null,
            ],
          ),
        ),
        ...[
          [t('vat.output'), vatSummary.output],
          [t('vat.input'), vatSummary.input],
          [t('vat.due'), vatSummary.output - vatSummary.input],
        ].map(([label, amount]) => [
          t('vat.title'),
          label,
          amount,
          null,
          null,
          null,
        ]),
        ...topCustomers.map((customer) => [
          t('topCustomers.title'),
          customer.name,
          customer.revenue,
          null,
          null,
          customer.invoicesCount,
        ]),
      );
    } else if (tab === 'balanceSheet') {
      const receivables = agingBuckets.reduce(
        (sum, bucket) => sum + bucket.amount,
        0,
      );
      const balanceSheet = computeBalanceSheet({
        cash: cashBalance,
        receivables,
        vatDue: vatSummary.output - vatSummary.input,
        netProfit: PNL.netProfit,
        inputs: balanceSheetInputs,
      });

      rows.push(
        [
          t('export.columns.section'),
          t('export.columns.item'),
          t('export.columns.amount'),
        ],
      );
      rows.push(
        ...[
          [
            t('balanceSheet.assets'),
            t('balanceSheet.lines.cash'),
            cashBalance,
          ],
          [
            t('balanceSheet.assets'),
            t('balanceSheet.lines.receivables'),
            receivables,
          ],
          [
            t('balanceSheet.assets'),
            t('balanceSheet.lines.fixedAssets'),
            balanceSheetInputs.fixedAssets,
          ],
          [
            t('balanceSheet.assets'),
            t('balanceSheet.totalAssets'),
            balanceSheet.totalAssets,
          ],
          [
            t('balanceSheet.liabilities'),
            t('balanceSheet.lines.accountsPayable'),
            balanceSheetInputs.accountsPayable,
          ],
          [
            t('balanceSheet.liabilities'),
            t('balanceSheet.lines.vatPayable'),
            vatSummary.output - vatSummary.input,
          ],
          [
            t('balanceSheet.liabilities'),
            t('balanceSheet.totalLiabilities'),
            balanceSheet.totalLiabilities,
          ],
          [
            t('balanceSheet.equity'),
            t('balanceSheet.lines.capital'),
            balanceSheetInputs.capital,
          ],
          [
            t('balanceSheet.equity'),
            t('balanceSheet.lines.retainedEarnings'),
            balanceSheet.retainedEarnings,
          ],
          [
            t('balanceSheet.equity'),
            t('balanceSheet.lines.currentProfit'),
            PNL.netProfit,
          ],
          [
            t('balanceSheet.equity'),
            t('balanceSheet.totalEquity'),
            balanceSheet.totalEquity,
          ],
        ],
      );
    } else if (tab === 'cashFlow') {
      const cashFlow = computeCashFlow({
        netProfit: PNL.netProfit,
        closingCash: cashBalance,
        inputs: cashFlowInputs,
      });

      rows.push(
        [
          t('export.columns.section'),
          t('export.columns.item'),
          t('export.columns.amount'),
        ],
      );
      rows.push(
        [
          t('cashFlow.operating'),
          t('cashFlow.lines.netProfit'),
          PNL.netProfit,
        ],
        [
          t('cashFlow.operating'),
          t('cashFlow.lines.receivablesChange'),
          -cashFlowInputs.receivablesIncrease,
        ],
        [
          t('cashFlow.operating'),
          t('cashFlow.lines.payablesChange'),
          cashFlowInputs.payablesIncrease,
        ],
        [
          t('cashFlow.operating'),
          t('cashFlow.totalOperating'),
          cashFlow.operating,
        ],
        [
          t('cashFlow.investing'),
          t('cashFlow.lines.equipment'),
          -cashFlowInputs.equipmentPurchase,
        ],
        [
          t('cashFlow.investing'),
          t('cashFlow.totalInvesting'),
          cashFlow.investing,
        ],
        [
          t('cashFlow.financing'),
          t('cashFlow.lines.ownerWithdrawals'),
          -cashFlowInputs.ownerWithdrawals,
        ],
        [
          t('cashFlow.financing'),
          t('cashFlow.totalFinancing'),
          cashFlow.financing,
        ],
        [t('cashFlow.summary.opening'), '', cashFlow.openingCash],
        [t('cashFlow.summary.netChange'), '', cashFlow.netChange],
        [t('cashFlow.summary.closing'), '', cashFlow.closingCash],
      );
    } else if (tab === 'aging') {
      const buckets = ['notDue', 'd1_30', 'd31_60', 'd60plus'] as const;
      rows.push(
        [
          t('agingTab.table.customer'),
          ...buckets.map((bucket) => t(`aging.buckets.${bucket}`)),
          t('agingTab.table.total'),
        ],
      );
      rows.push(
        ...agingRows.map((customer) => [
          customer.name,
          ...buckets.map((bucket) => customer[bucket]),
          buckets.reduce((total, bucket) => total + customer[bucket], 0),
        ]),
        [
          t('agingTab.table.total'),
          ...buckets.map(
            (bucket) =>
              agingBuckets.find((item) => item.key === bucket)?.amount ?? 0,
          ),
          agingBuckets.reduce((total, bucket) => total + bucket.amount, 0),
        ],
      );
    } else if (tab === 'vat') {
      rows.push([t('export.columns.item'), t('export.columns.amount')]);
      rows.push(
        [t('vat.output'), vatSummary.output],
        [t('vat.input'), vatSummary.input],
        [t('vat.due'), vatSummary.output - vatSummary.input],
        [t('vatTab.details.rate'), `${VAT_RATE * 100}%`],
        [t('vatTab.details.taxableSales'), Math.round(vatSummary.output / VAT_RATE)],
        [t('vat.dueDate'), vatSummary.dueDate],
      );
    } else {
      const customer =
        customerStatements.find((item) => item.id === statementCustomerId) ??
        customerStatements[0];
      const statement = computeStatement(customer);

      rows.push(
        [
          t('statementTab.table.date'),
          t('statementTab.table.description'),
          t('export.columns.reference'),
          t('statementTab.table.debit'),
          t('statementTab.table.credit'),
          t('statementTab.table.balance'),
        ],
      );
      rows.push(
        [
          '',
          t('statementTab.table.opening'),
          '',
          null,
          null,
          statement.opening,
        ],
        ...statement.rows.map((transaction) => [
          transaction.date,
          t(`statementTab.table.types.${transaction.type}`),
          transaction.ref,
          transaction.type === 'invoice' ? transaction.amount : null,
          transaction.type === 'payment' ? transaction.amount : null,
          transaction.balance,
        ]),
        [
          '',
          t('statementTab.table.closing'),
          '',
          statement.invoiced,
          statement.paid,
          statement.closing,
        ],
      );
    }

    downloadCsv(`Reports-${period}-${tab}.csv`, rows);
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
                  {PERIODS.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => setPeriod(p)}
                      className="text-ink-2 h-10 justify-between rounded-btn px-3 text-xs font-semibold data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                    >
                      {t(`periods.${p}`)}
                      {p === period && (
                        <Check className="text-brand size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="my-2" />
                  <div className="text-muted px-3 py-2 text-[10px] font-extrabold tracking-wide uppercase">
                    {t('filter.months')}
                  </div>
                  {[...SERIES].reverse().map(({ month }) => (
                    <DropdownMenuItem
                      key={month}
                      onClick={() => setPeriod(month)}
                      className="text-ink-2 h-10 justify-between rounded-btn px-3 text-xs font-semibold data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                    >
                      {monthYear(monthToDate(month))}
                      {month === period && (
                        <Check className="text-brand size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
                onClick={() => printWithTitle(`Reports-${period}`)}
              >
                <Download className="size-4" />
                {t('actions.pdf')}
              </button>

              <button
                type="button"
                className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
                onClick={downloadExcel}
              >
                <FileSpreadsheet className="size-4" />
                {t('actions.excel')}
              </button>
            </>
          }
        />

        <ReportsTabs value={tab} tabs={tabs} onChange={setTab} />
        {statCards}
        {reportContent}
      </div>

      <ReportsPrintSheet
        title={t('title')}
        period={periodText}
        basis={t('basis')}
        tab={tabs.find((item) => item.value === tab)?.label ?? ''}
      >
        {statCards}
        {reportContent}
      </ReportsPrintSheet>
    </>
  );
}
