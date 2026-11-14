// component/dashbord/payments/PaymentsView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import Amount from '@/component/Amount';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { Button } from '@/components/ui/button';
import { useMoney } from '@/lib/money';
import {
  mockPayments,
  openInvoices as mockOpenInvoices,
  type OpenInvoice,
  type Payment,
} from '@/lib/mock/payments';
import { CURRENT_MONTH } from '@/lib/mock/reports';
import type { PaymentFormValues } from '@/lib/validations/payments';
import { shiftMonth } from '../expenses/utils';
import Pagination from '../Pagination';
import { changePct } from '../reports/utils';
import PaymentsTable from './PaymentsTable';
import PaymentsToolbar from './PaymentsToolbar';
import RecordPaymentCard from './RecordPaymentCard';
import { useExportPayments } from './useExportPayments';
import {
  applyFilters,
  computePaymentStats,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  type Filters,
} from './utils';
import RemindersCard from './RemindersCard';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

export default function PaymentsView() {
  const t = useTranslations('Payments');
  const format = useFormatter();
  const money = useMoney();
  const exportPayments = useExportPayments();

  // TODO: لما نربط الـ API الدفعات والفواتير دي بتيجي من الباك إند
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [invoices, setInvoices] = useState<OpenInvoice[]>(mockOpenInvoices);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [requestedPage, setPage] = useState(1);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  function addPayment(values: PaymentFormValues, inv: OpenInvoice) {
    // TODO: POST /payments لما نربط الـ API
    const amount = Number(values.amount);
    const lastNo = payments.reduce(
      (max, p) => Math.max(max, Number(p.number.slice(4))),
      0,
    );

    const payment: Payment = {
      id: `p${Date.now()}`,
      number: `PAY-${String(lastNo + 1).padStart(4, '0')}`,
      invoiceNo: inv.number,
      customer: inv.customer,
      date: values.date,
      invoiceDate: inv.issued,
      method: values.method,
      amount,
      // الشيك بيتحسب محصّل لما يتصرف
      status: values.method === 'cheque' ? 'pending' : 'cleared',
      account: values.account,
      reference: values.reference || undefined,
      note: values.note || undefined,
    };

    setPayments((list) => [payment, ...list]);
    setInvoices((list) =>
      amount >= inv.balance
        ? list.filter((i) => i.number !== inv.number)
        : list.map((i) =>
            i.number === inv.number ? { ...i, balance: i.balance - amount } : i,
          ),
    );

    // نرجّع الفلاتر علشان الدفعة الجديدة تظهر في أول الجدول
    setFilters(DEFAULT_FILTERS);
    setPage(1);

    toast.success(
      t('toasts.added', { number: payment.number, amount: money(amount) }),
      {
        action: {
          label: t('toasts.undo'),
          onClick: () => {
            setPayments((list) => list.filter((p) => p.id !== payment.id));
            // بنرجّع المبلغ على الرصيد الحالي مش على النسخة القديمة، علشان أي دفعة اتسجلت بعدها ما تضيعش
            setInvoices((list) =>
              list.some((i) => i.number === inv.number)
                ? list.map((i) =>
                    i.number === inv.number
                      ? { ...i, balance: i.balance + amount }
                      : i,
                  )
                : [...list, inv].sort(
                    (a, b) => a.number - b.number,
                  ),
            );
          },
        },
      },
    );
  }

  const stats = computePaymentStats({
    payments,
    openInvoices: invoices,
    month: CURRENT_MONTH,
    prevMonth: shiftMonth(CURRENT_MONTH, -1),
  });

  const rows = useMemo(
    () => applyFilters(payments, filters, CURRENT_MONTH),
    [payments, filters],
  );
  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const num = (value: number) =>
    format.number(value, { numberingSystem: 'latn' });

  const pct = (value: number) =>
    format.number(value / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
      signDisplay: 'always',
    });

  const avgHint =
    stats.avgDays === null || stats.prevAvgDays === null
      ? t('stats.avgHintNone')
      : stats.avgDays < stats.prevAvgDays
        ? t('stats.avgHintBetter', { prev: num(stats.prevAvgDays) })
        : stats.avgDays > stats.prevAvgDays
          ? t('stats.avgHintWorse', { prev: num(stats.prevAvgDays) })
          : t('stats.avgHintSame');

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('summary', {
          count: payments.length,
          text: num(payments.length),
        })}
        actions={
          <Button
            variant="outline"
            className={outlineBtn}
            disabled={rows.length === 0}
            onClick={() => exportPayments(rows)}
          >
            <Download className="size-4" />
            {t('actions.export')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('stats.collected')}
          value={<Amount amount={stats.collected} />}
          hint={t('stats.collectedHint', {
            pct: pct(changePct(stats.collected, stats.prevCollected)),
          })}
          tone="brand"
        />
        <StatCard
          label={t('stats.pending')}
          value={<Amount amount={stats.openAmount} />}
          hint={t('stats.pendingHint', {
            count: stats.openCount,
            text: num(stats.openCount),
          })}
        />
        <StatCard
          label={t('stats.cheques')}
          value={<Amount amount={stats.chequeAmount} />}
          hint={t('stats.chequesHint', {
            count: stats.chequeCount,
            text: num(stats.chequeCount),
          })}
        />
        <StatCard
          label={t('stats.avgDays')}
          value={stats.avgDays === null ? '—' : num(stats.avgDays)}
          hint={avgHint}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
          <PaymentsToolbar filters={filters} onChange={update} />

          {rows.length === 0 ? (
            <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
              {t('empty')}
            </div>
          ) : (
            <>
              <PaymentsTable rows={pageRows} />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={rows.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>

        <div className="space-y-4">
          <RecordPaymentCard invoices={invoices} onAdd={addPayment} />
          <RemindersCard invoices={invoices} />
        </div>
      </div>
    </div>
  );
}
