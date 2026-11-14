// components/invoices/InvoiceDetailView.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { MOCK_NOW, type InvoiceStatus } from '@/lib/mock/invoices';
import { printWithTitle } from '@/lib/print';
import { cn } from '@/lib/utils';
import AttachmentsCard from './AttachmentsCard';
import HistoryTimeline from './HistoryTimeline';
import InvoiceDocument from './InvoiceDocument';
import InvoicePrintSheet from './InvoicePrintSheet';
import LedgerSheet from './LedgerSheet';
import PaymentDialog, { type PaymentInput } from './PaymentDialog';
import PaymentsCard from './PaymentsCard';
import PreviewDialog from './PreviewDialog';
import QuickActionsCard from './QuickActionsCard';
import ReminderDialog, { type ReminderInput } from './ReminderDialog';
import StatusBadge from './StatusBadge';
import PageHeader from '@/component/PageHeader';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function InvoiceDetailView({
  invoice: initial,
}: {
  invoice: InvoiceDetail;
}) {
  const t = useTranslations('InvoiceDetail');
  const locale = useLocale();
  const date = useDate();

  // TODO: لما نربط الـ API الحالة دي بتيجي من الباك إند
  const [invoice, setInvoice] = useState(initial);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const canPay =
    invoice.remaining > 0 &&
    invoice.status !== 'draft' &&
    invoice.status !== 'cancelled';

  function recordPayment(input: PaymentInput) {
    setInvoice((prev) => {
      const remaining = Math.max(0, prev.remaining - input.amount);
      const id = `p-${Date.now()}`;
      const status: InvoiceStatus =
        remaining === 0
          ? 'paid'
          : prev.status === 'overdue'
            ? 'overdue'
            : 'partial';

      return {
        ...prev,
        remaining,
        status,
        daysOverdue: remaining === 0 ? undefined : prev.daysOverdue,
        payments: [
          ...prev.payments,
          {
            id,
            amount: input.amount,
            date: input.date,
            method: input.method,
            note: input.note || undefined,
          },
        ],
        history: [
          {
            id: `h-${id}`,
            type: 'payment',
            at: input.date,
            values: { amount: input.amount },
          },
          ...prev.history,
        ],
      };
    });
    setPaymentOpen(false);
  }

  // TODO: الإرسال الفعلي (بريد أو واتساب) من الباك إند. دلوقتي بيتسجل في السجل بس
  function sendReminder(input: ReminderInput) {
    const at = `${MOCK_NOW.toISOString().slice(0, 10)}${new Date().toISOString().slice(10)}`;

    setInvoice((prev) => ({
      ...prev,
      history: [
        {
          id: `h-r-${Date.now()}`,
          type: 'reminderSent',
          at,
          values: { channel: input.channel },
        },
        ...prev.history,
      ],
    }));
    setReminderOpen(false);
    toast.success(t('toasts.reminderSent', { recipient: input.recipient }));
  }

  // TODO: الرابط الحقيقي لازم يستخدم رمز عشوائي مش رقم الفاتورة، وصفحته هنعملها بعدين
  async function copyLink() {
    const url = `${window.location.origin}/${locale}/i/${invoice.number}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('toasts.linkCopied'));
    } catch {
      toast.error(t('toasts.linkFailed'));
    }
  }

  // بيفتح نافذة الطباعة، واسم الملف الافتراضي Invoice-1038.pdf
  function downloadPdf() {
    printWithTitle(`Invoice-${invoice.number}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <>
            {t('title')}{' '}
            <span dir="ltr" className="inline-block">
              #{invoice.number}
            </span>
          </>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              {t('subtitle', {
                customer: invoice.customer,
                date: date(invoice.issueDate),
              })}
            </span>
            <StatusBadge
              status={invoice.status}
              daysOverdue={invoice.daysOverdue}
            />
          </span>
        }
        actions={
          <>
            <Link
              href="/invoices"
              className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            <Button
              variant="outline"
              onClick={downloadPdf}
              className={outlineBtn}
            >
              <Download className="size-4" />
              {t('downloadPdf')}
            </Button>
            <Button
              className={primaryBtn}
              disabled={!canPay}
              onClick={() => setPaymentOpen(true)}
            >
              {t('recordPayment')}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* العمود الرئيسي: الفاتورة + المرفقات */}
        <div className="min-w-0 space-y-5">
          <InvoiceDocument invoice={invoice} />
          <AttachmentsCard />
        </div>

        {/* العمود الجانبي */}
        <aside className="space-y-5">
          <QuickActionsCard
            canPay={canPay}
            canShare={invoice.status !== 'draft'}
            onRecordPayment={() => setPaymentOpen(true)}
            onSendReminder={() => setReminderOpen(true)}
            onCopyLink={copyLink}
            onPreview={() => setPreviewOpen(true)}
            onViewEntry={() => setLedgerOpen(true)}
          />
          <PaymentsCard payments={invoice.payments} />
          <HistoryTimeline events={invoice.history} />
        </aside>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        number={invoice.number}
        customer={invoice.customer}
        remaining={invoice.remaining}
        onSubmit={recordPayment}
      />

      <ReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        invoice={invoice}
        onSend={sendReminder}
      />

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoice={invoice}
      />

      <LedgerSheet
        open={ledgerOpen}
        onOpenChange={setLedgerOpen}
        invoice={invoice}
      />

      {/* نسخة الطباعة: مخفية على الشاشة وبتظهر وقت الطباعة بس */}
      <InvoicePrintSheet invoice={invoice} />
    </div>
  );
}
