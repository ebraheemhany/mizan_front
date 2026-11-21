// components/quotes/QuoteDetailView.tsx
'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Link2,
  Loader2,
  Mail,
  Pencil,
  Receipt,
  Send,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useDate } from '@/lib/data';
import { toUiQuoteDetail, useEmailQuote, useQuote, type ApiQuoteDetail } from '@/lib/quotes/hooks';
import { cn } from '@/lib/utils';
import SendEmailDialog, { type SendEmailInput } from '../SendEmailDialog';
import QuoteDocument from './QuoteDocument';
import QuoteHistory from './QuoteHistory';
import QuoteStatusBadge from './QuoteStatusBadge';
import { useQuoteActions, useQuoteErrorMessage } from './useQuoteActions';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

type Action = {
  key: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
  primary?: boolean;
  danger?: boolean;
};

/** Loads the quote (by number) from the API, then shows it. */
export default function QuoteDetailView({ number }: { number: number }) {
  const t = useTranslations('QuotesApi');
  const errorMessage = useQuoteErrorMessage();
  // 0 = the URL wasn't a quote number: nothing to load.
  const query = useQuote(number, { enabled: number > 0 });
  const notFound = number <= 0 || (query.error instanceof ApiError && query.error.status === 404);

  if (!notFound && query.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (notFound || query.isError) {
    return (
      <div className="rounded-card border-line bg-surface mx-auto max-w-md space-y-3 border p-8 text-center shadow-sm">
        <h1 className="text-ink text-lg font-extrabold">{notFound ? t('notFoundTitle') : t('loadError')}</h1>
        <p className="text-muted text-sm">{notFound ? t('notFoundBody') : errorMessage(query.error)}</p>
        <div className="flex justify-center gap-2 pt-2">
          {!notFound && (
            <Button variant="outline" className={outlineBtn} onClick={() => query.refetch()}>
              {t('retry')}
            </Button>
          )}
          <Link href="/quotes" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
            {t('backToList')}
          </Link>
        </div>
      </div>
    );
  }
  return query.data ? <QuoteDetailContent data={query.data} /> : null;
}

function QuoteDetailContent({ data }: { data: ApiQuoteDetail }) {
  const t = useTranslations('QuoteDetail');
  const tq = useTranslations('Quotes');
  const tApi = useTranslations('QuotesApi');
  const router = useRouter();
  const date = useDate();
  const actions = useQuoteActions();
  const locale = useLocale();
  const errorMessage = useQuoteErrorMessage();
  const emailQuote = useEmailQuote();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const quote = toUiQuoteDetail(data);
  const { allowed } = actions;

  async function sendEmail(input: SendEmailInput) {
    try {
      await emailQuote.mutateAsync({
        ref: quote.id,
        body: { to: input.to, message: input.message || undefined, locale: locale === 'en' ? 'en' : 'ar' },
      });
      toast.success(tApi('emailed', { to: input.to }));
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function remove() {
    setDeleteOpen(false);
    if (await actions.remove(quote)) router.push('/quotes');
  }

  // What can be done now (by status and role); the first primary one also goes in the header.
  const list: Action[] = [];
  if (allowed.edit(quote)) {
    list.push({ key: 'edit', label: tq('actions.edit'), icon: Pencil, run: () => actions.edit(quote) });
  }
  if (allowed.send(quote)) {
    list.push({ key: 'send', label: tq('actions.send'), icon: Send, run: () => void actions.send(quote), primary: true });
  }
  if (allowed.email(quote)) {
    list.push({ key: 'email', label: tq('actions.sendEmail'), icon: Mail, run: () => setEmailOpen(true) });
  }
  if (allowed.decide(quote)) {
    list.push({ key: 'accept', label: tq('actions.accept'), icon: Check, run: () => void actions.accept(quote), primary: true });
    list.push({ key: 'reject', label: tq('actions.reject'), icon: X, run: () => void actions.reject(quote) });
  }
  if (allowed.convert(quote)) {
    list.push({ key: 'convert', label: tq('actions.convert'), icon: Receipt, run: () => actions.convert(quote), primary: true });
  }
  if (quote.invoice) {
    const invoiceNumber = quote.invoice.number;
    list.push({
      key: 'invoice',
      label: tApi('viewInvoice', { number: quote.invoice.displayNumber }),
      icon: FileText,
      run: () => router.push(`/invoices/${invoiceNumber}`),
      primary: true,
    });
  }
  if (allowed.share(quote) && quote.publicToken) {
    list.push({ key: 'link', label: tq('actions.copyCustomerLink'), icon: Link2, run: () => void actions.copyLink(quote) });
  }
  if (allowed.duplicate()) {
    list.push({
      key: 'duplicate',
      label: tq('actions.duplicate'),
      icon: Copy,
      run: () => void actions.duplicate(quote, { open: true }),
    });
  }
  if (allowed.delete(quote)) {
    list.push({ key: 'delete', label: tq('actions.delete'), icon: Trash2, run: () => setDeleteOpen(true), danger: true });
  }

  const primary = list.find((a) => a.primary);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <>
            {t('title')}{' '}
            <span dir="ltr" className="inline-block">
              {quote.displayNumber}
            </span>
          </>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{t('subtitle', { customer: quote.customer, date: date(quote.issueDate) })}</span>
            <QuoteStatusBadge quote={quote} />
            {quote.invoice && (
              <Link
                href={`/invoices/${quote.invoice.number}`}
                className="text-brand-deep inline-flex items-center gap-1 font-bold hover:underline"
              >
                <FileText className="size-3.5" aria-hidden="true" />
                {tApi('convertedTo', { number: quote.invoice.displayNumber })}
              </Link>
            )}
          </span>
        }
        actions={
          <>
            <Link href="/quotes" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            {primary && (
              <Button className={primaryBtn} disabled={actions.pending} onClick={primary.run}>
                {actions.pending ? <Loader2 className="size-4 animate-spin" /> : <primary.icon className="size-4" />}
                {primary.label}
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <QuoteDocument quote={quote} />
        </div>

        <aside className="space-y-5">
          {list.length > 0 && (
            <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
              <h2 className="text-ink text-base font-extrabold">{t('actionsTitle')}</h2>

              <div className="mt-4 space-y-2.5">
                {list.map((a) => (
                  <Button
                    key={a.key}
                    variant={a.primary ? 'default' : 'outline'}
                    disabled={actions.pending}
                    onClick={a.run}
                    className={cn(
                      'rounded-btn h-11 w-full gap-2 text-sm font-bold',
                      a.primary && 'bg-brand hover:bg-brand/90 text-white',
                      !a.primary && 'border-line-strong bg-surface text-ink hover:bg-canvas',
                      a.danger && 'text-danger hover:bg-danger-soft hover:text-danger',
                    )}
                  >
                    <a.icon className="size-4" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <QuoteHistory events={quote.history} customer={quote.customer} />
        </aside>
      </div>

      <SendEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        title={tApi('emailDialog.title')}
        description={tApi('emailDialog.description', { number: quote.displayNumber, customer: quote.customer })}
        defaultTo={quote.client.email ?? ''}
        hint={tApi('emailDialog.hint')}
        onSend={sendEmail}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={tq('deleteDialog.title', { number: quote.displayNumber })}
        description={quote.status === 'draft' ? tq('deleteDialog.description') : tApi('deleteSentDescription')}
        cancelLabel={tq('deleteDialog.keep')}
        confirmLabel={tq('deleteDialog.confirm')}
        onConfirm={() => void remove()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
