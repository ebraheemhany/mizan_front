// components/invoices/InvoiceDetailView.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Ban, Download, Loader2, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useDate } from '@/lib/data';
import { toUiDetail, useInvoice, useInvoiceAction } from '@/lib/invoices/hooks';
import { printWithTitle } from '@/lib/print';
import { cn } from '@/lib/utils';
import PageHeader from '@/component/PageHeader';
import SendEmailDialog, { type SendEmailInput } from '../SendEmailDialog';
import AttachmentsCard from './AttachmentsCard';
import CancelInvoiceDialog from './CancelInvoiceDialog';
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
import { useSendReminder } from './useSendReminder';
import { canCancel, canRecordPayment, canSendReminder } from './utils';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

/** Loads the invoice (by number or id) from the API, then shows it. */
export default function InvoiceDetailView({ invoiceRef }: { invoiceRef: string }) {
  const t = useTranslations('InvoicesApi');
  const query = useInvoice(invoiceRef);

  if (query.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="rounded-card border-line bg-surface mx-auto max-w-md space-y-3 border p-8 text-center shadow-sm">
        <h1 className="text-ink text-lg font-extrabold">{notFound ? t('notFoundTitle') : t('loadError')}</h1>
        {notFound && <p className="text-muted text-sm">{t('notFoundBody')}</p>}
        <div className="flex justify-center gap-2 pt-2">
          {!notFound && (
            <Button variant="outline" className={outlineBtn} onClick={() => query.refetch()}>
              {t('retry')}
            </Button>
          )}
          <Link href="/invoices" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
            {t('backToList')}
          </Link>
        </div>
      </div>
    );
  }
  return <InvoiceDetailContent data={query.data} />;
}

function InvoiceDetailContent({ data }: { data: NonNullable<ReturnType<typeof useInvoice>['data']> }) {
  const t = useTranslations('InvoiceDetail');
  const tInvoices = useTranslations('Invoices');
  const tApi = useTranslations('InvoicesApi');
  const locale = useLocale();
  const date = useDate();
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const action = useInvoiceAction();

  const invoice = toUiDetail(data);
  const mayIssue = can(user.role, 'issueInvoices');
  const mayPay = can(user.role, 'recordPayments') && canRecordPayment(invoice);
  const mayRemind = mayIssue && canSendReminder(invoice);
  const mayCancel = mayIssue && canCancel(invoice);
  // Issued and owed or paid (a draft has no page yet; a cancelled one isn't owed).
  const mayEmail =
    mayIssue && Boolean(data.publicToken) && invoice.status !== 'draft' && invoice.status !== 'cancelled';
  const mailLocale: 'ar' | 'en' = locale === 'en' ? 'en' : 'ar';
  const sendReminderTo = useSendReminder();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  async function run(promise: Promise<unknown>, success: string) {
    try {
      await promise;
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function recordPayment(input: PaymentInput) {
    const ok = await run(
      action.mutateAsync({
        kind: 'payment',
        ref: invoice.id,
        body: { amount: input.amount.toFixed(2), date: input.date, method: input.method, note: input.note },
      }),
      tInvoices('toasts.paymentRecorded', { number: String(invoice.number) }),
    );
    if (ok) setPaymentOpen(false);
  }

  async function sendReminder(input: ReminderInput) {
    if (await sendReminderTo(invoice, input)) setReminderOpen(false);
  }

  function emailInvoice(input: SendEmailInput) {
    return run(
      action.mutateAsync({
        kind: 'email',
        ref: invoice.id,
        body: { to: input.to, message: input.message || undefined, locale: mailLocale },
      }),
      t('toasts.emailed', { to: input.to }),
    );
  }

  function issue() {
    void run(action.mutateAsync({ kind: 'send', ref: invoice.id }), tApi('issued', { number: String(invoice.number) }));
  }

  async function cancel() {
    setCancelOpen(false);
    await run(
      action.mutateAsync({ kind: 'cancel', ref: invoice.id }),
      tInvoices('toasts.cancelled', { number: String(invoice.number) }),
    );
  }

  // The link uses a random token, so invoice numbers can't be guessed.
  async function copyLink() {
    if (!data.publicToken) {
      toast.info(tApi('publicUnavailable'));
      return;
    }
    const url = `${window.location.origin}/${locale}/i/${data.publicToken}`;
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
              {data.displayNumber}
            </span>
          </>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{t('subtitle', { customer: invoice.customer, date: date(invoice.issueDate) })}</span>
            <StatusBadge status={invoice.status} daysOverdue={invoice.daysOverdue} />
            {/* Made by a recurring template: link back to it. */}
            {data.recurring && (
              <Link
                href={`/invoices/recurring/${data.recurring.id}/edit`}
                className="text-brand-deep text-xs font-bold hover:underline"
              >
                {tApi('fromRecurring', { name: data.recurring.name })}
              </Link>
            )}
          </span>
        }
        actions={
          <>
            <Link href="/invoices" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            <Button variant="outline" onClick={downloadPdf} className={outlineBtn}>
              <Download className="size-4" />
              {t('downloadPdf')}
            </Button>
            {mayCancel && (
              <Button
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className={cn(outlineBtn, 'text-danger hover:text-danger')}
              >
                <Ban className="size-4" />
                {tApi('cancel')}
              </Button>
            )}
            {invoice.status === 'draft' && mayIssue ? (
              <Button className={primaryBtn} disabled={action.isPending} onClick={issue}>
                {action.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {tApi('issue')}
              </Button>
            ) : (
              <Button className={primaryBtn} disabled={!mayPay} onClick={() => setPaymentOpen(true)}>
                {t('recordPayment')}
              </Button>
            )}
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
            canPay={mayPay}
            canShare={Boolean(data.publicToken)}
            canEmail={mayEmail}
            onEmail={() => setEmailOpen(true)}
            onRecordPayment={() => setPaymentOpen(true)}
            onSendReminder={() => (mayRemind ? setReminderOpen(true) : undefined)}
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

      <ReminderDialog open={reminderOpen} onOpenChange={setReminderOpen} invoice={invoice} onSend={sendReminder} />

      <SendEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        title={t('emailDialog.title')}
        description={t('emailDialog.description', { number: data.displayNumber, customer: invoice.customer })}
        defaultTo={invoice.client.email ?? ''}
        hint={t('emailDialog.hint')}
        onSend={emailInvoice}
      />

      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} invoice={invoice} />

      <LedgerSheet open={ledgerOpen} onOpenChange={setLedgerOpen} invoice={invoice} />

      <CancelInvoiceDialog invoices={cancelOpen ? [invoice] : null} onConfirm={cancel} onClose={() => setCancelOpen(false)} />

      {/* نسخة الطباعة: مخفية على الشاشة وبتظهر وقت الطباعة بس */}
      <InvoicePrintSheet invoice={invoice} />
    </div>
  );
}
