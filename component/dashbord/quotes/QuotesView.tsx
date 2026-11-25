// components/quotes/QuotesView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Loader2, Plus } from 'lucide-react';
import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import {
  toUiQuote,
  useQuotesList,
  useQuoteStats,
  type Quote,
  type QuoteListParams,
} from '@/lib/quotes/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import FilterTabs from '../FilterTabs';
import Pagination from '../Pagination';
import QuotesStats from './QuotesStats';
import QuotesTable from './QuotesTable';
import QuotesToolbar from './QuotesToolbar';
import RecordAnswerDialog, { type AnswerTarget } from './RecordAnswerDialog';
import { useQuoteActions, useQuoteErrorMessage } from './useQuoteActions';
import { DEFAULT_FILTERS, PAGE_SIZE, type Filters, type StatusFilter } from './utils';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

const TAB_KEYS: StatusFilter[] = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'];

export default function QuotesView() {
  const t = useTranslations('Quotes');
  const tApi = useTranslations('QuotesApi');
  const format = useFormatter();
  const errorMessage = useQuoteErrorMessage();
  const actions = useQuoteActions();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  // An answer the customer gave outside Mizan, waiting to be confirmed.
  const [answer, setAnswer] = useState<AnswerTarget<Quote>>(null);

  const query = useDebouncedValue(filters.query.trim(), 300);
  const params: QuoteListParams = {
    q: query.slice(0, 100) || undefined,
    status: filters.status,
    period: filters.period,
    page,
    pageSize: PAGE_SIZE,
  };
  const listQuery = useQuotesList(params);
  const statsQuery = useQuoteStats();

  const data = listQuery.data;
  const rows = useMemo(() => data?.items.map(toUiQuote) ?? [], [data]);

  // The tab counts follow the search and the period. "No quotes yet" and the header's
  // total are about all of the company's quotes, so they use the last count taken with
  // neither filter.
  const unfiltered = filters.query.trim() === '' && filters.period === 'all';
  const [allQuotes, setAllQuotes] = useState<number | null>(null);
  if (unfiltered && data && !listQuery.isPlaceholderData && data.counts.all !== allQuotes) {
    setAllQuotes(data.counts.all);
  }

  // Any filter change goes back to page 1.
  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const tabs = TAB_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
    count: data?.counts[key] ?? 0,
  }));

  const rate = statsQuery.data?.acceptanceRate ?? null;
  const rateText =
    rate === null
      ? '—'
      : format.number(rate / 100, { style: 'percent', maximumFractionDigits: 0, numberingSystem: 'latn' });

  async function duplicate(q: Quote) {
    // Back to the first page of everything, where the new draft shows first.
    if (await actions.duplicate(q)) {
      setFilters(DEFAULT_FILTERS);
      setPage(1);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const deleted = await actions.remove(target);
    // The last row of the last page: go back a page instead of showing an empty table.
    if (deleted && rows.length === 1 && page > 1) setPage(page - 1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={allQuotes === null ? undefined : t('summary', { count: allQuotes, rate: rateText })}
        actions={
          actions.canManage && (
            <Link href="/quotes/new" className={cn(buttonVariants(), primaryBtn)}>
              <Plus className="size-4" />
              {t('new')}
            </Link>
          )
        }
      />

      <QuotesStats stats={statsQuery.data} />

      <FilterTabs value={filters.status} tabs={tabs} onChange={(status) => update({ status })} />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <QuotesToolbar filters={filters} onChange={update} />

        {listQuery.isPending ? (
          <div className="border-line text-muted flex justify-center border-t px-4 py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : listQuery.isError ? (
          <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
            <p className="text-danger text-sm font-semibold">{errorMessage(listQuery.error)}</p>
            <Button variant="outline" className={outlineBtn} onClick={() => listQuery.refetch()}>
              {tApi('retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {unfiltered && filters.status === 'all' && data?.counts.all === 0 ? tApi('emptyAll') : t('empty')}
          </div>
        ) : (
          // Dimmed while the next page or filter result loads.
          <div className={listQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <QuotesTable
              rows={rows}
              allowed={actions.allowed}
              onSend={(q) => void actions.send(q)}
              onAccept={(q) => setAnswer({ quote: q, kind: 'accept' })}
              onReject={(q) => setAnswer({ quote: q, kind: 'reject' })}
              onConvert={actions.convert}
              onShare={(q) => void actions.copyLink(q)}
              onEdit={actions.edit}
              onDuplicate={(q) => void duplicate(q)}
              onDelete={setDeleteTarget}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
          </div>
        )}
      </div>

      <RecordAnswerDialog
        target={answer}
        onConfirm={(q, kind) => void (kind === 'accept' ? actions.accept(q) : actions.reject(q))}
        onClose={() => setAnswer(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('deleteDialog.title', { number: deleteTarget?.displayNumber ?? '' })}
        description={
          deleteTarget && deleteTarget.status !== 'draft'
            ? tApi('deleteSentDescription')
            : t('deleteDialog.description')
        }
        cancelLabel={t('deleteDialog.keep')}
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
