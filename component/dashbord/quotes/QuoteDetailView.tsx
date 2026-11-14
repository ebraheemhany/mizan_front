// components/quotes/QuoteDetailView.tsx
'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Pencil,
  Receipt,
  Send,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import { addDaysIso } from '@/lib/iso-date';
import { createQuoteDetail } from '@/lib/mock/quote-details';
import {
  effectiveStatus,
  quoteLabel,
  TODAY,
  VALIDITY_DAYS,
  type Quote,
} from '@/lib/mock/quotes';
import { cn } from '@/lib/utils';
import QuoteDocument from './QuoteDocument';
import QuoteHistory from './QuoteHistory';
import QuoteStatusBadge from './QuoteStatusBadge';
import { useQuotes } from './QuotesProvider';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

type Action = {
  key: 'send' | 'accept' | 'reject' | 'convert' | 'delete' | 'edit';
  icon: LucideIcon;
  run: () => void;
  primary?: boolean;
  danger?: boolean;
};

export default function QuoteDetailView({
  number,
}: {
  number: number;
}) {
  const t = useTranslations('QuoteDetail');
  const tq = useTranslations('Quotes');
  const router = useRouter();
  const date = useDate();
  const { quotes, setQuotes, hydrated } = useQuotes();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const quoteRecord = quotes.find((item) => item.number === number);
  const quote = quoteRecord ? createQuoteDetail(quoteRecord) : undefined;

  const status = quote ? effectiveStatus(quote) : undefined;
  const label = quote ? quoteLabel(quote.number) : quoteLabel(number);

  function change(patch: Partial<Quote>) {
    if (!quoteRecord) return () => {};
    const previous = quoteRecord;
    setQuotes((list) =>
      list.map((item) =>
        item.id === previous.id ? { ...item, ...patch } : item,
      ),
    );
    return () =>
      setQuotes((list) =>
        list.map((item) => (item.id === previous.id ? previous : item)),
      );
  }

  function send() {
    const undo = change({
      status: 'sent',
      issueDate: TODAY,
      validUntil: addDaysIso(TODAY, VALIDITY_DAYS),
      sentDate: TODAY,
      acceptedDate: undefined,
      rejectedDate: undefined,
    });
    toast.success(
      tq('toasts.sent', { number: label, customer: quote?.customer ?? '' }),
      {
        action: { label: tq('toasts.undo'), onClick: undo },
      },
    );
  }

  function accept() {
    const undo = change({
      status: 'accepted',
      acceptedDate: TODAY,
      rejectedDate: undefined,
    });
    toast.success(tq('toasts.accepted', { number: label }), {
      duration: 8000,
      action: {
        label: tq('toasts.convert'),
        onClick: () =>
          router.push(`/invoices/new?fromQuote=${number}`),
      },
      cancel: { label: tq('toasts.undo'), onClick: undo },
    });
  }

  function reject() {
    const undo = change({
      status: 'rejected',
      rejectedDate: TODAY,
      acceptedDate: undefined,
    });
    toast.success(tq('toasts.rejected', { number: label }), {
      action: { label: tq('toasts.undo'), onClick: undo },
    });
  }

  const convert = () => router.push(`/invoices/new?fromQuote=${number}`);

  function remove() {
    if (!quoteRecord) return;
    const index = quotes.findIndex((item) => item.id === quoteRecord.id);
    setQuotes((list) => list.filter((item) => item.id !== quoteRecord.id));
    setDeleteOpen(false);
    toast.success(tq('toasts.deleted', { number: label }), {
      action: {
        label: tq('toasts.undo'),
        onClick: () =>
          setQuotes((list) => {
            const restored = [...list];
            restored.splice(Math.min(index, restored.length), 0, quoteRecord);
            return restored;
          }),
      },
    });
    router.push('/quotes');
  }

  if (!hydrated) {
    return <p className="text-muted text-sm">{t('loading')}</p>;
  }

  if (!quote) {
    return <p className="text-muted text-sm">{t('unavailable')}</p>;
  }

  // الإجراءات المتاحة بحسب الحالة، وأول واحد هو الرئيسي
  const actions: Action[] = [];
  if (status === 'draft') {
    actions.push({
      key: 'edit',
      icon: Pencil,
      run: () => router.push(`/quotes/new?edit=${number}`),
    });
    actions.push({ key: 'send', icon: Send, run: send, primary: true });
  }
  if (status === 'sent') {
    actions.push({ key: 'accept', icon: Check, run: accept, primary: true });
    actions.push({ key: 'reject', icon: X, run: reject });
  }
  if (status === 'accepted')
    actions.push({
      key: 'convert',
      icon: Receipt,
      run: convert,
      primary: true,
    });
  if (status === 'draft') {
    actions.push({
      key: 'delete',
      icon: Trash2,
      run: () => setDeleteOpen(true),
      danger: true,
    });
  }

  const primary = actions.find((a) => a.primary);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <>
            {t('title')}{' '}
            <span dir="ltr" className="inline-block">
              #{label}
            </span>
          </>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              {t('subtitle', {
                customer: quote.customer,
                date: date(quote.issueDate),
              })}
            </span>
            <QuoteStatusBadge quote={quote} />
          </span>
        }
        actions={
          <>
            <Link
              href="/quotes"
              className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            {primary && (
              <Button className={primaryBtn} onClick={primary.run}>
                <primary.icon className="size-4" />
                {tq(`actions.${primary.key}`)}
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
          {actions.length > 0 && (
            <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
              <h2 className="text-ink text-base font-extrabold">
                {t('actionsTitle')}
              </h2>

              <div className="mt-4 space-y-2.5">
                {actions.map((a) => (
                  <Button
                    key={a.key}
                    variant={a.primary ? 'default' : 'outline'}
                    onClick={a.run}
                    className={cn(
                      'rounded-btn h-11 w-full gap-2 text-sm font-bold',
                      a.primary && 'bg-brand hover:bg-brand/90 text-white',
                      !a.primary &&
                        'border-line-strong bg-surface text-ink hover:bg-canvas',
                      a.danger &&
                        'text-danger hover:bg-danger-soft hover:text-danger',
                    )}
                  >
                    <a.icon className="size-4" />
                    {tq(`actions.${a.key}`)}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <QuoteHistory events={quote.history} customer={quote.customer} />
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={tq('deleteDialog.title', { number: `#${label}` })}
        description={tq('deleteDialog.description')}
        cancelLabel={tq('deleteDialog.keep')}
        confirmLabel={tq('deleteDialog.confirm')}
        onConfirm={remove}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
