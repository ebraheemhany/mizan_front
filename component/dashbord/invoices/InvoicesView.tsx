// components/invoices/InvoicesView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Plus, Repeat } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  INVOICES,
  INVOICE_STATS,
  MOCK_NOW,
  type Invoice,
  type InvoiceStatus,
} from '@/lib/mock/invoices';
import {
  getInvoiceDetail,
  type InvoiceDetail,
} from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';
import BulkActionsBar from './BulkActionsBar';
import CancelInvoiceDialog from './CancelInvoiceDialog';
import InvoiceStats from './InvoiceStats';
import InvoicesTable from './InvoicesTable';
import InvoicesToolbar from './InvoicesToolbar';
import PaymentDialog, { type PaymentInput } from './PaymentDialog';
import ReminderDialog, { type ReminderInput } from './ReminderDialog';
import { usePrintInvoice } from './usePrintInvoice';
import {
  applyFilters,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  canCancel,
  canSendReminder,
  type Filters,
  type StatusFilter,
} from './utils';
import PageHeader from '@/component/PageHeader';
import FilterTabs from '../FilterTabs';
import Pagination from '../Pagination';
import { useExportInvoices } from './useExportInvoices';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

const TAB_KEYS: StatusFilter[] = [
  'all',
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue',
  'cancelled',
];

export default function InvoicesView() {
  const t = useTranslations('Invoices');
  const tDetail = useTranslations('InvoiceDetail');
  const money = useMoney();
  const { print, sheet } = usePrintInvoice();
  const exportInvoices = useExportInvoices();
  // TODO: لما نربط الـ API الفواتير دي بتيجي من الباك إند
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [additionalCollected, setAdditionalCollected] = useState(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [requestedPage, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice[] | null>(null);
  const [reminderQueue, setReminderQueue] = useState<InvoiceDetail[] | null>(
    null,
  );

  // أي تغيير في الفلاتر يرجّعك للصفحة الأولى ويلغي التحديد
  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Set());
  };

  const rows = useMemo(
    () => applyFilters(invoices, filters),
    [invoices, filters],
  );
  const stats = useMemo(() => {
    const unpaidInvoices = invoices.filter(
      (invoice) =>
        invoice.remaining > 0 &&
        invoice.status !== 'draft' &&
        invoice.status !== 'cancelled',
    );
    const overdueInvoices = unpaidInvoices.filter(
      (invoice) => invoice.status === 'overdue',
    );
    const draftInvoices = invoices.filter(
      (invoice) => invoice.status === 'draft',
    );

    return {
      ...INVOICE_STATS,
      outstanding: unpaidInvoices.reduce(
        (total, invoice) => total + invoice.remaining,
        0,
      ),
      unpaidCount: unpaidInvoices.length,
      overdue: overdueInvoices.reduce(
        (total, invoice) => total + invoice.remaining,
        0,
      ),
      overdueCount: overdueInvoices.length,
      collectedThisMonth:
        INVOICE_STATS.collectedThisMonth + additionalCollected,
      draftsCount: draftInvoices.length,
      draftsValue: draftInvoices.reduce(
        (total, invoice) => total + invoice.total,
        0,
      ),
    };
  }, [additionalCollected, invoices]);
  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedInvoice =
    selected.size === 1
      ? (invoices.find((invoice) => selected.has(invoice.id)) ?? null)
      : null;
  const selectedCancellableInvoices = invoices.filter(
    (invoice) => selected.has(invoice.id) && canCancel(invoice),
  );
  const selectedRemindableInvoices = invoices.filter(
    (invoice) => selected.has(invoice.id) && canSendReminder(invoice),
  );
  const allSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        value: key,
        label: t(`tabs.${key}`),
        count:
          key === 'all'
            ? invoices.length
            : invoices.filter((i) => i.status === key).length,
        tone: key === 'overdue' ? ('danger' as const) : undefined,
      })),
    [t, invoices],
  );

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // مربع الهيدر بيحدد صفوف الصفحة الحالية بس
  const togglePage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of pageRows) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });

  function recordPayment(input: PaymentInput) {
    if (!payTarget) return;
    const { id, number } = payTarget;

    if (input.date.slice(0, 7) === MOCK_NOW.toISOString().slice(0, 7)) {
      setAdditionalCollected((total) => total + input.amount);
    }

    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        const remaining = Math.max(0, i.remaining - input.amount);
        const status: InvoiceStatus =
          remaining === 0
            ? 'paid'
            : i.status === 'overdue'
              ? 'overdue'
              : 'partial';

        return {
          ...i,
          remaining,
          status,
          daysOverdue: remaining === 0 ? undefined : i.daysOverdue,
        };
      }),
    );

    setPayTarget(null);
    toast.success(t('toasts.paymentRecorded', { number: String(number) }));
  }

  function cancelInvoice() {
    if (!cancelTarget?.length) return;
    const cancelledInvoices = cancelTarget;
    const cancelledIds = new Set(
      cancelledInvoices.map((invoice) => invoice.id),
    );

    setInvoices((prev) =>
      prev.map((i) =>
        cancelledIds.has(i.id)
          ? { ...i, status: 'cancelled', remaining: 0, daysOverdue: undefined }
          : i,
      ),
    );

    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of cancelledIds) next.delete(id);
      return next;
    });
    setCancelTarget(null);
    if (cancelledInvoices.length === 1) {
      toast.success(
        t('toasts.cancelled', {
          number: String(cancelledInvoices[0].number),
        }),
      );
    } else {
      toast.success(
        t('toasts.cancelledMultiple', { count: cancelledInvoices.length }),
      );
    }
  }

  function startReminders() {
    const details = selectedRemindableInvoices.map((invoice) => {
      const detail = getInvoiceDetail(invoice.number);
      return detail ? { ...detail, ...invoice } : null;
    });

    if (details.some((detail) => detail === null)) {
      toast.error(t('toasts.reminderUnavailable'));
      return;
    }

    setReminderQueue(
      details.filter((detail): detail is InvoiceDetail => detail !== null),
    );
  }

  function sendReminder(input: ReminderInput) {
    if (!reminderQueue?.length) return;

    setReminderQueue((prev) => {
      if (!prev || prev.length <= 1) return null;
      return prev.slice(1);
    });
    toast.success(
      tDetail('toasts.reminderSent', { recipient: input.recipient }),
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('summary', {
          count: invoices.length,
          amount: money(stats.outstanding),
        })}
        actions={
          <>
            <Button
              variant="outline"
              className={outlineBtn}
              disabled={rows.length === 0}
              onClick={() => exportInvoices(rows)}
            >
              <Download className="size-4" />
              {t('export')}
            </Button>
            <Link
              href="/invoices/recurring"
              className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
            >
              <Repeat className="size-4" />
              {t('recurring')}
            </Link>
            <Link
              href="/invoices/new"
              className={cn(buttonVariants(), primaryBtn)}
            >
              <Plus className="size-4" />
              {t('new')}
            </Link>
          </>
        }
      />

      <InvoiceStats stats={stats} />

      <FilterTabs
        value={filters.status}
        tabs={tabs}
        onChange={(status) => update({ status })}
      />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <InvoicesToolbar filters={filters} onChange={update} />

        {selected.size > 0 && (
          <BulkActionsBar
            count={selected.size}
            remindCount={selectedRemindableInvoices.length}
            cancelCount={selectedCancellableInvoices.length}
            onRemind={startReminders}
            onCancel={() => setCancelTarget(selectedCancellableInvoices)}
            onExport={() =>
              exportInvoices(
                invoices.filter((i) => selected.has(i.id)),
                'invoices-selected',
              )
            }
          />
        )}

        {rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {t('empty')}
          </div>
        ) : (
          <>
            <InvoicesTable
              rows={pageRows}
              selected={selected}
              allSelected={allSelected}
              onToggleRow={toggleRow}
              onToggleAll={togglePage}
              onDownload={print}
              onRecordPayment={setPayTarget}
              onCancel={(invoice) => setCancelTarget([invoice])}
            />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {payTarget && (
        <PaymentDialog
          open
          onOpenChange={(open) => {
            if (!open) setPayTarget(null);
          }}
          number={payTarget.number}
          customer={payTarget.customer}
          remaining={payTarget.remaining}
          onSubmit={recordPayment}
        />
      )}

      <CancelInvoiceDialog
        invoices={cancelTarget}
        onConfirm={cancelInvoice}
        onClose={() => setCancelTarget(null)}
      />

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
