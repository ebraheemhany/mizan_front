// components/invoices/InvoicesView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2, Plus, Repeat } from 'lucide-react';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useRecordPaymentWithProof } from '@/lib/collections/hooks';
import { useCustomers } from '@/lib/customers/hooks';
import {
  fetchInvoicesForExport,
  invoiceLabel,
  toUiDetail,
  toUiInvoice,
  useBulkCancelInvoices,
  useFetchInvoice,
  useInvoices,
  useInvoiceStats,
  type InvoiceListParams,
} from '@/lib/invoices/hooks';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import type { Invoice } from '@/lib/mock/invoices';
import { useMoney } from '@/lib/money';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import PageHeader from '@/component/PageHeader';
import FilterTabs from '../FilterTabs';
import Pagination from '../Pagination';
import BulkActionsBar from './BulkActionsBar';
import CancelInvoiceDialog from './CancelInvoiceDialog';
import InvoiceStats from './InvoiceStats';
import InvoicesTable from './InvoicesTable';
import InvoicesToolbar from './InvoicesToolbar';
import PaymentDialog, { type PaymentInput } from './PaymentDialog';
import ReminderDialog, { type ReminderInput } from './ReminderDialog';
import { useSendReminder } from './useSendReminder';
import { useExportInvoices } from './useExportInvoices';
import { usePrintInvoice } from './usePrintInvoice';
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  PERIOD_TO_API,
  canCancel,
  canSendReminder,
  type Filters,
  type StatusFilter,
} from './utils';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

const TAB_KEYS: StatusFilter[] = ['all', 'draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];

const EMPTY_STATS = {
  outstanding: 0,
  unpaidCount: 0,
  overdue: 0,
  overdueCount: 0,
  collectedThisMonth: 0,
  collectedChangePct: 0,
  draftsCount: 0,
  draftsValue: 0,
};

export default function InvoicesView() {
  const t = useTranslations('Invoices');
  const tApi = useTranslations('InvoicesApi');
  const money = useMoney();
  const errorMessage = useApiErrorMessage();
  const sendReminderTo = useSendReminder();
  const user = useSession();
  const canIssue = can(user.role, 'issueInvoices');
  const canPay = can(user.role, 'recordPayments');
  const { print, sheet } = usePrintInvoice();
  const exportInvoices = useExportInvoices();
  const fetchInvoice = useFetchInvoice();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  // Selected invoices by id, kept as objects so the selection survives paging.
  const [selected, setSelected] = useState<Map<string, Invoice>>(new Map());
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice[] | null>(null);
  const [reminderQueue, setReminderQueue] = useState<InvoiceDetail[] | null>(null);

  const query = useDebouncedValue(filters.query.trim(), 300);
  const params: InvoiceListParams = {
    q: query || undefined,
    status: filters.status,
    customerId: filters.customer === 'all' ? undefined : filters.customer,
    period: PERIOD_TO_API[filters.period],
    sort: filters.sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const invoicesQuery = useInvoices(params);
  const statsQuery = useInvoiceStats();
  // Customers for the filter (first 100 by name).
  const customersQuery = useCustomers({ status: 'all', balance: 'all', sort: 'name', page: 1, pageSize: 100 });
  const customerOptions = useMemo(
    () => customersQuery.data?.items.map((c) => ({ id: c.id, name: c.name })) ?? [],
    [customersQuery.data],
  );

  const recordPaymentWithProof = useRecordPaymentWithProof();
  const tDetail = useTranslations('InvoiceDetail');
  const bulkCancel = useBulkCancelInvoices();

  const data = invoicesQuery.data;
  const rows = useMemo(() => data?.items.map(toUiInvoice) ?? [], [data]);
  const stats = statsQuery.data ?? EMPTY_STATS;
  const selectedIds = useMemo(() => new Set(selected.keys()), [selected]);
  const selectedList = [...selected.values()];
  const cancellable = canIssue ? selectedList.filter(canCancel) : [];
  const remindable = canIssue ? selectedList.filter(canSendReminder) : [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  // Any filter change goes back to page 1 and clears the selection.
  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Map());
  };

  const tabs = TAB_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
    count: data?.counts[key] ?? 0,
    tone: key === 'overdue' ? ('danger' as const) : undefined,
  }));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Map(prev);
      const row = rows.find((r) => r.id === id);
      if (next.has(id)) next.delete(id);
      else if (row) next.set(id, row);
      return next;
    });

  // مربع الهيدر بيحدد صفوف الصفحة الحالية بس
  const togglePage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const r of rows) {
        if (checked) next.set(r.id, r);
        else next.delete(r.id);
      }
      return next;
    });

  async function recordPayment(input: PaymentInput) {
    if (!payTarget) return;
    const target = payTarget;
    try {
      const { proofFailed } = await recordPaymentWithProof.mutateAsync({ ref: target.id, input });
      setPayTarget(null);
      toast.success(t('toasts.paymentRecorded', { number: invoiceLabel(target) }));
      if (proofFailed) toast.warning(tDetail('paymentDialog.proofFailed'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function cancelInvoices() {
    if (!cancelTarget?.length) return;
    const targets = cancelTarget;
    setCancelTarget(null);
    try {
      const { cancelled } = await bulkCancel.mutateAsync(targets.map((i) => i.id));
      setSelected((prev) => {
        const next = new Map(prev);
        for (const i of targets) next.delete(i.id);
        return next;
      });
      if (targets.length === 1 && cancelled === 1) {
        toast.success(t('toasts.cancelled', { number: invoiceLabel(targets[0]) }));
      } else {
        toast.success(t('toasts.cancelledMultiple', { count: cancelled }));
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function startReminders() {
    try {
      // The dialog needs the customer's email/phone, which only the full invoice has.
      const details = await Promise.all(remindable.map((i) => fetchInvoice(i.id)));
      setReminderQueue(details.map(toUiDetail));
    } catch {
      toast.error(t('toasts.reminderUnavailable'));
    }
  }

  async function sendReminder(input: ReminderInput) {
    const current = reminderQueue?.[0];
    if (!current) return;
    if (await sendReminderTo(current, input)) {
      setReminderQueue((prev) => (!prev || prev.length <= 1 ? null : prev.slice(1)));
    }
  }

  async function exportAll() {
    try {
      const items = await fetchInvoicesForExport({
        q: params.q,
        status: params.status,
        customerId: params.customerId,
        period: params.period,
        sort: params.sort,
      });
      exportInvoices(items.map(toUiInvoice));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('summary', { count: data?.counts.all ?? 0, amount: money(stats.outstanding) })}
        actions={
          <>
            <Button variant="outline" className={outlineBtn} disabled={!data?.total} onClick={exportAll}>
              <Download className="size-4" />
              {t('export')}
            </Button>
            <Link href="/invoices/recurring" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <Repeat className="size-4" />
              {t('recurring')}
            </Link>
            {canIssue && (
              <Link href="/invoices/new" className={cn(buttonVariants(), primaryBtn)}>
                <Plus className="size-4" />
                {t('new')}
              </Link>
            )}
          </>
        }
      />

      <InvoiceStats stats={stats} />

      <FilterTabs value={filters.status} tabs={tabs} onChange={(status) => update({ status })} />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <InvoicesToolbar filters={filters} customers={customerOptions} onChange={update} />

        {selected.size > 0 && (
          <BulkActionsBar
            count={selected.size}
            remindCount={remindable.length}
            cancelCount={cancellable.length}
            onRemind={startReminders}
            onCancel={() => setCancelTarget(cancellable)}
            onExport={() => exportInvoices(selectedList, 'invoices-selected')}
          />
        )}

        {invoicesQuery.isPending ? (
          <div className="border-line text-muted flex justify-center border-t px-4 py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : invoicesQuery.isError ? (
          <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
            <p className="text-danger text-sm font-semibold">{errorMessage(invoicesQuery.error)}</p>
            <Button variant="outline" className={outlineBtn} onClick={() => invoicesQuery.refetch()}>
              {tApi('retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">{t('empty')}</div>
        ) : (
          // Dimmed while the next page or filter result loads.
          <div className={invoicesQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <InvoicesTable
              rows={rows}
              selected={selectedIds}
              allSelected={allSelected}
              onToggleRow={toggleRow}
              onToggleAll={togglePage}
              onDownload={print}
              onRecordPayment={canPay ? setPayTarget : undefined}
              onCancel={canIssue ? (invoice) => setCancelTarget([invoice]) : undefined}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
          </div>
        )}
      </div>

      {payTarget && (
        <PaymentDialog
          open
          onOpenChange={(open) => {
            if (!open) setPayTarget(null);
          }}
          number={invoiceLabel(payTarget)}
          customer={payTarget.customer}
          remaining={payTarget.remaining}
          onSubmit={recordPayment}
        />
      )}

      <CancelInvoiceDialog invoices={cancelTarget} onConfirm={cancelInvoices} onClose={() => setCancelTarget(null)} />

      {reminderQueue?.[0] && (
        <ReminderDialog
          key={reminderQueue[0].id}
          open
          onOpenChange={(open) => {
            if (!open) setReminderQueue(null);
          }}
          invoice={reminderQueue[0]}
          onSend={sendReminder}
        />
      )}

      {sheet}
    </div>
  );
}
