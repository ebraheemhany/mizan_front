// components/quotes/QuotesView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/component/ConfirmDialog';

import PageHeader from '@/component/PageHeader';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { addDaysIso } from '@/lib/iso-date';
import {
  effectiveStatus,
  quoteLabel,
  TODAY,
  VALIDITY_DAYS,
  type Quote,
  type QuoteStatus,
} from '@/lib/mock/quotes';
import QuotesStats from './QuotesStats';
import QuotesTable from './QuotesTable';
import QuotesToolbar from './QuotesToolbar';
import {
  applyFilters,
  computeStats,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  type Filters,
  type StatusFilter,
} from './utils';
import FilterTabs from '../FilterTabs';
import Pagination from '../Pagination';
import { useQuotes } from './QuotesProvider';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

const TAB_KEYS: StatusFilter[] = [
  'all',
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
];

export default function QuotesView() {
  const t = useTranslations('Quotes');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const { quotes, setQuotes } = useQuotes();

  // TODO: لما نربط الـ API العروض دي بتيجي من الباك إند
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [requestedPage, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const rows = useMemo(() => applyFilters(quotes, filters), [quotes, filters]);
  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        value: key,
        label: t(`tabs.${key}`),
        count:
          key === 'all'
            ? quotes.length
            : quotes.filter((q) => effectiveStatus(q) === key).length,
      })),
    [t, quotes],
  );

  const rate = useMemo(() => computeStats(quotes).rate, [quotes]);
  const rateText =
    rate === null
      ? '—'
      : format.number(rate, {
          style: 'percent',
          maximumFractionDigits: 0,
          numberingSystem: 'latn',
        });

  const restore = (prev: Quote) =>
    setQuotes((list) => list.map((x) => (x.id === prev.id ? prev : x)));

  function change(prev: Quote, patch: Partial<Quote>) {
    // TODO: PATCH /quotes/:id لما نربط الـ API
    setQuotes((list) =>
      list.map((x) => (x.id === prev.id ? { ...x, ...patch } : x)),
    );
  }

  function sendQuote(q: Quote) {
    change(q, {
      status: 'sent',
      issueDate: TODAY,
      validUntil: addDaysIso(TODAY, VALIDITY_DAYS),
      sentDate: TODAY,
      acceptedDate: undefined,
      rejectedDate: undefined,
    });

    toast.success(
      t('toasts.sent', { number: quoteLabel(q.number), customer: q.customer }),
      {
        action: { label: t('toasts.undo'), onClick: () => restore(q) },
      },
    );
  }

  function acceptQuote(q: Quote) {
    change(q, {
      status: 'accepted',
      acceptedDate: TODAY,
      rejectedDate: undefined,
    });

    toast.success(t('toasts.accepted', { number: quoteLabel(q.number) }), {
      duration: 8000,
      action: {
        label: t('toasts.convert'),
        onClick: () =>
          router.push(`/invoices/new?fromQuote=${q.number}`),
      },
      cancel: { label: t('toasts.undo'), onClick: () => restore(q) },
    });
  }

  function rejectQuote(q: Quote) {
    change(q, {
      status: 'rejected',
      rejectedDate: TODAY,
      acceptedDate: undefined,
    });

    toast.success(t('toasts.rejected', { number: quoteLabel(q.number) }), {
      action: { label: t('toasts.undo'), onClick: () => restore(q) },
    });
  }

  function convertQuote(q: Quote) {
    router.push(`/invoices/new?fromQuote=${q.number}`);
  }

  function editQuote(q: Quote) {
    router.push(`/quotes/new?edit=${q.number}`);
  }

  async function shareQuote(q: Quote) {
    const shareToken = q.shareToken ?? crypto.randomUUID();
    const shareUrl = new URL(
      `/${locale}/share/quotes/${shareToken}`,
      window.location.origin,
    ).toString();

    if (!q.shareToken) {
      setQuotes((list) =>
        list.map((quote) =>
          quote.id === q.id ? { ...quote, shareToken } : quote,
        ),
      );
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('toasts.linkCopied'));
    } catch (error) {
      console.error('Could not copy the customer quote link.', error);
      toast.error(t('toasts.linkFailed'), { description: shareUrl });
    }
  }

  function duplicateQuote(q: Quote) {
    const number = Math.max(...quotes.map((x) => x.number)) + 1;
    const copy: Quote = {
      id: `q${number}`,
      number,
      customer: q.customer,
      total: q.total,
      status: 'draft',
      issueDate: TODAY,
      validUntil: addDaysIso(TODAY, VALIDITY_DAYS),
      items: q.items,
      notes: q.notes,
    };

    setQuotes((list) => [copy, ...list]);

    // نرجّع الفلاتر علشان المسودة الجديدة تظهر في أول الجدول
    setFilters(DEFAULT_FILTERS);
    setPage(1);

    toast.success(t('toasts.duplicated', { number: quoteLabel(number) }), {
      action: {
        label: t('toasts.undo'),
        onClick: () =>
          setQuotes((list) => list.filter((x) => x.id !== copy.id)),
      },
    });
  }

  function deleteQuote() {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const index = quotes.findIndex((x) => x.id === target.id);

    // TODO: DELETE /quotes/:id لما نربط الـ API
    setQuotes((list) => list.filter((x) => x.id !== target.id));
    setDeleteTarget(null);

    toast.success(t('toasts.deleted', { number: quoteLabel(target.number) }), {
      action: {
        label: t('toasts.undo'),
        onClick: () =>
          setQuotes((list) => {
            const copy = [...list];
            copy.splice(Math.min(index, copy.length), 0, target);
            return copy;
          }),
      },
    });
  }

  return (
    <div className="space-y-5">
      <p className="bg-amber-50 text-amber-900 rounded-xl px-4 py-3 text-xs leading-5">
        {t('demoNotice')}
      </p>
      <PageHeader
        title={t('title')}
        description={t('summary', { count: quotes.length, rate: rateText })}
        actions={
          <Button
            className={primaryBtn}
            onClick={() => router.push('/quotes/new')}
          >
            <Plus className="size-4" />
            {t('new')}
          </Button>
        }
      />

      <QuotesStats quotes={quotes} />

      <FilterTabs
        value={filters.status}
        tabs={tabs}
        onChange={(status) => update({ status })}
      />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <QuotesToolbar filters={filters} onChange={update} />

        {rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {t('empty')}
          </div>
        ) : (
          <>
            <QuotesTable
              rows={pageRows}
              onSend={sendQuote}
              onAccept={acceptQuote}
              onReject={rejectQuote}
              onConvert={convertQuote}
              onShare={shareQuote}
              onEdit={editQuote}
              onDuplicate={duplicateQuote}
              onDelete={setDeleteTarget}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('deleteDialog.title', {
          number: deleteTarget ? `#${quoteLabel(deleteTarget.number)}` : '',
        })}
        description={t('deleteDialog.description')}
        cancelLabel={t('deleteDialog.keep')}
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={deleteQuote}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
