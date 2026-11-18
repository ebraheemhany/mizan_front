// component/dashbord/payments/PaymentsView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import Amount from '@/component/Amount';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import type { OpenInvoice } from '@/lib/mock/payments';
import { useMoney } from '@/lib/money';
import {
  fetchPaymentsForExport,
  toUiPayment,
  useClearPayment,
  useOpenInvoices,
  usePayments,
  usePaymentStats,
  useRecordPayment,
  useRemovePayment,
} from '@/lib/payments/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { PaymentFormValues } from '@/lib/validations/payments';
import Pagination from '../Pagination';
import PaymentsTable from './PaymentsTable';
import PaymentsToolbar from './PaymentsToolbar';
import RecordPaymentCard from './RecordPaymentCard';
import RemindersCard from './RemindersCard';
import { useExportPayments } from './useExportPayments';
import { DEFAULT_FILTERS, PAGE_SIZE, type Filters } from './utils';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

export default function PaymentsView() {
  const t = useTranslations('Payments');
  const tApi = useTranslations('PaymentsApi');
  const format = useFormatter();
  const money = useMoney();
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const canRecord = can(user.role, 'recordPayments');
  const exportPayments = useExportPayments();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const query = useDebouncedValue(filters.query.trim(), 300);
  const paymentsQuery = usePayments({
    q: query || undefined,
    method: filters.method,
    period: filters.period,
    page,
    pageSize: PAGE_SIZE,
  });
  const statsQuery = usePaymentStats();
  const openInvoicesQuery = useOpenInvoices();
  const openInvoices = useMemo(() => openInvoicesQuery.data ?? [], [openInvoicesQuery.data]);

  const recordPayment = useRecordPayment();
  const clearPayment = useClearPayment();
  const removePayment = useRemovePayment();

  const data = paymentsQuery.data;
  const rows = useMemo(() => data?.items.map(toUiPayment) ?? [], [data]);
  const stats = statsQuery.data;

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  async function addPayment(values: PaymentFormValues, inv: OpenInvoice) {
    const target = openInvoices.find((i) => i.number === inv.number);
    if (!target) return;
    try {
      const payment = await recordPayment.mutateAsync({
        invoiceId: target.id,
        amount: values.amount,
        date: values.date,
        method: values.method,
        account: values.account,
        reference: values.reference,
        note: values.note,
      });
      // Back to the default view so the new payment shows first.
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      toast.success(t('toasts.added', { number: payment.number, amount: money(Number(payment.amount)) }), {
        action: {
          label: t('toasts.undo'),
          // Undo removes the payment: the amount goes back onto the invoice.
          onClick: () =>
            removePayment.mutate(payment.id, {
              onSuccess: () => toast.success(tApi('removed', { number: payment.number })),
              onError: (error) => toast.error(errorMessage(error)),
            }),
        },
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function markCleared(id: string, number: string) {
    clearPayment.mutate(id, {
      onSuccess: () => toast.success(tApi('cleared', { number })),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  async function exportAll() {
    try {
      exportPayments(await fetchPaymentsForExport({ q: query || undefined, method: filters.method, period: filters.period }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const num = (value: number) => format.number(value, { numberingSystem: 'latn' });
  const pct = (value: number) =>
    format.number(value / 100, { style: 'percent', maximumFractionDigits: 0, numberingSystem: 'latn', signDisplay: 'always' });

  const avg = stats?.avgDaysToCollect ?? null;
  const prevAvg = stats?.avgDaysToCollectLastMonth ?? null;
  const avgHint =
    avg === null || prevAvg === null
      ? t('stats.avgHintNone')
      : avg < prevAvg
        ? t('stats.avgHintBetter', { prev: num(prevAvg) })
        : avg > prevAvg
          ? t('stats.avgHintWorse', { prev: num(prevAvg) })
          : t('stats.avgHintSame');

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('summary', { count: data?.all ?? 0, text: num(data?.all ?? 0) })}
        actions={
          <Button variant="outline" className={outlineBtn} disabled={!data?.total} onClick={exportAll}>
            <Download className="size-4" />
            {t('actions.export')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('stats.collected')}
          value={<Amount amount={stats?.collectedThisMonth ?? 0} />}
          hint={t('stats.collectedHint', { pct: pct(stats?.collectedChangePct ?? 0) })}
          tone="brand"
        />
        <StatCard
          label={t('stats.pending')}
          value={<Amount amount={stats?.awaiting ?? 0} />}
          hint={t('stats.pendingHint', { count: stats?.awaitingCount ?? 0, text: num(stats?.awaitingCount ?? 0) })}
        />
        <StatCard
          label={t('stats.cheques')}
          value={<Amount amount={stats?.pendingCheques ?? 0} />}
          hint={t('stats.chequesHint', {
            count: stats?.pendingChequesCount ?? 0,
            text: num(stats?.pendingChequesCount ?? 0),
          })}
        />
        <StatCard label={t('stats.avgDays')} value={avg === null ? '—' : num(avg)} hint={avgHint} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
          <PaymentsToolbar filters={filters} onChange={update} />

          {paymentsQuery.isPending ? (
            <div className="border-line text-muted flex justify-center border-t px-4 py-14">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : paymentsQuery.isError ? (
            <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
              <p className="text-danger text-sm font-semibold">{errorMessage(paymentsQuery.error)}</p>
              <Button variant="outline" className={outlineBtn} onClick={() => paymentsQuery.refetch()}>
                {tApi('retry')}
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">{t('empty')}</div>
          ) : (
            <div className={paymentsQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <PaymentsTable rows={rows} onClear={canRecord ? (p) => markCleared(p.id, p.number) : undefined} />
              <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {canRecord && <RecordPaymentCard invoices={openInvoices} onAdd={addPayment} />}
          <RemindersCard invoices={openInvoices} />
        </div>
      </div>
    </div>
  );
}
