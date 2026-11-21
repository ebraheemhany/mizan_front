// component/dashbord/accounts/JournalTab.tsx
'use client';

import { Fragment, useDeferredValue, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChevronDown, CircleDot, Layers, Loader2, Pencil, Search, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import FilterPopover from '@/component/dashbord/FilterPopover';
import Pagination from '@/component/dashbord/Pagination';
import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import {
  SOURCE_FILTERS,
  useDeleteEntry,
  useJournal,
  usePostEntry,
  type EntryStatus,
  type JournalEntry,
  type SourceFilter,
} from '@/lib/ledger/hooks';
import { cn } from '@/lib/utils';
import { card, sourceGroup, td, th, useAccountName, useDay, useEntryText, useMonthLabel, useNum } from './ledger-ui';

const PAGE_SIZE = 10;
const STATUSES: EntryStatus[] = ['posted', 'draft'];

const STATUS_STYLES: Record<EntryStatus, string> = {
  posted: 'bg-brand-soft text-brand-deep',
  draft: 'bg-neutral-soft text-ink-2',
};

/** Where an entry's document is (manual entries have none). */
function sourceHref(e: JournalEntry) {
  if (e.invoice && (e.source === 'invoice' || e.source === 'payment' || e.source === 'chequeCleared')) {
    return `/invoices/${e.invoice.number}`;
  }
  if (e.source === 'expense' || e.source === 'expensePayment') return '/expenses';
  return null;
}

export default function JournalTab({
  months,
  closedThrough,
  canWrite,
  onEdit,
}: {
  /** Months with anything in the books (for the month filter), newest first. */
  months: string[];
  closedThrough: string | null;
  canWrite: boolean;
  onEdit: (entry: JournalEntry) => void;
}) {
  const t = useTranslations('Accounts');
  const num = useNum();
  const day = useDay();
  const monthLabel = useMonthLabel();
  const accountName = useAccountName();
  const entryText = useEntryText();
  const errorMessage = useApiErrorMessage();
  const postEntry = usePostEntry();
  const deleteEntry = useDeleteEntry();

  const [search, setSearch] = useState('');
  const q = useDeferredValue(search.trim());
  const [source, setSource] = useState<SourceFilter>('all');
  const [status, setStatus] = useState<'all' | EntryStatus>('all');
  const [month, setMonth] = useState('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<JournalEntry | null>(null);

  const journal = useJournal({
    q,
    source,
    status,
    month: month === 'all' ? null : month,
    page,
    pageSize: PAGE_SIZE,
  });
  const rows = journal.data?.items ?? [];
  const total = journal.data?.total ?? 0;

  // Any filter change goes back to the first page.
  const withReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const editable = (e: JournalEntry) =>
    canWrite && e.source === 'manual' && (closedThrough === null || e.date > closedThrough);

  async function post(e: JournalEntry) {
    try {
      await postEntry.mutateAsync(e.id);
      toast.success(t('journal.postedToast', { number: e.ref ?? '' }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function remove() {
    if (!deleting) return;
    const entry = deleting;
    setDeleting(null);
    try {
      await deleteEntry.mutateAsync(entry.id);
      if (rows.length === 1 && page > 1) setPage(page - 1);
      toast.success(t('journal.deletedToast', { number: entry.ref ?? '' }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className={card}>
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="text-muted pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => withReset(setSearch)(e.target.value)}
            placeholder={t('journal.searchPlaceholder')}
            maxLength={100}
            className="border-line-strong placeholder:text-muted focus-visible:ring-brand/30 rounded-btn h-11 w-full border bg-transparent ps-10 pe-4 text-xs outline-none focus-visible:ring-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPopover
            icon={Layers}
            label={t('journal.sourceLabel')}
            value={source}
            allValue="all"
            onChange={withReset((v: string) => setSource(v as SourceFilter))}
            options={[
              { value: 'all', label: t('journal.allSources') },
              ...SOURCE_FILTERS.map((s) => ({ value: s, label: t(`journal.sources.${s}`) })),
            ]}
          />
          <FilterPopover
            icon={CircleDot}
            label={t('journal.statusLabel')}
            value={status}
            allValue="all"
            onChange={withReset((v: string) => setStatus(v as 'all' | EntryStatus))}
            options={[
              { value: 'all', label: t('journal.allStatuses') },
              ...STATUSES.map((s) => ({ value: s, label: t(`journal.status.${s}`) })),
            ]}
          />
          <FilterPopover
            icon={CalendarDays}
            label={t('trialTab.periodLabel')}
            value={month}
            allValue="all"
            onChange={withReset(setMonth)}
            options={[
              { value: 'all', label: t('trialTab.allPeriods') },
              ...months.map((m) => ({ value: m, label: monthLabel(m) })),
            ]}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr>
              <th className={cn(th, 'w-10')} />
              <th className={th}>{t('entries.number')}</th>
              <th className={th}>{t('entries.date')}</th>
              <th className={th}>{t('entries.description')}</th>
              <th className={th}>{t('journal.source')}</th>
              <th className={th}>{t('entries.debit')}</th>
              <th className={th}>{t('entries.credit')}</th>
              <th className={th}>{t('journal.statusLabel')}</th>
              <th className={cn(th, 'w-24')} />
            </tr>
          </thead>
          <tbody>
            {journal.isPending ? (
              <tr>
                <td colSpan={9} className="text-muted py-12 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : journal.isError ? (
              <tr>
                <td colSpan={9} className="text-danger py-12 text-center text-sm font-semibold">
                  {errorMessage(journal.error)}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted py-12 text-center text-sm">
                  {t('journal.empty')}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const key = `${r.source}:${r.id}`;
                const open = openId === key;
                const href = sourceHref(r);
                return (
                  <Fragment key={key}>
                    <tr className="border-line border-t">
                      <td className="ps-3">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={t('journal.toggleLines')}
                          onClick={() => setOpenId(open ? null : key)}
                          className="text-muted hover:text-ink flex size-7 items-center justify-center"
                        >
                          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                        </button>
                      </td>
                      <td className={cn(td, 'text-brand font-bold')}>
                        {r.ref ? (
                          href ? (
                            <Link href={href} dir="ltr" className="inline-block hover:underline">
                              {r.ref}
                            </Link>
                          ) : (
                            <span dir="ltr" className="inline-block">
                              {r.ref}
                            </span>
                          )
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className={cn(td, 'text-ink-2 whitespace-nowrap')}>{day(r.date, true)}</td>
                      <td className={cn(td, 'text-ink-2 max-w-[22rem]')}>
                        {href && !r.ref ? (
                          <Link href={href} className="hover:underline">
                            {entryText(r)}
                          </Link>
                        ) : (
                          entryText(r)
                        )}
                      </td>
                      <td className={td}>
                        <span className="bg-neutral-soft text-ink-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap">
                          {t(`journal.sources.${sourceGroup(r.source)}`)}
                        </span>
                      </td>
                      <td className={cn(td, 'text-ink-2 tabular-nums')}>{num(r.amount)}</td>
                      <td className={cn(td, 'text-ink-2 tabular-nums')}>{num(r.amount)}</td>
                      <td className={td}>
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            STATUS_STYLES[r.status],
                          )}
                        >
                          {t(`journal.status.${r.status}`)}
                        </span>
                      </td>
                      <td className="pe-3">
                        {editable(r) && (
                          <div className="flex items-center justify-end gap-0.5">
                            {r.status === 'draft' && (
                              <button
                                type="button"
                                title={t('journal.post')}
                                aria-label={t('journal.post')}
                                disabled={postEntry.isPending}
                                onClick={() => post(r)}
                                className="text-muted hover:bg-brand-soft hover:text-brand-deep rounded-lg p-1.5 transition-colors"
                              >
                                <Send className="size-4 rtl:-scale-x-100" />
                              </button>
                            )}
                            <button
                              type="button"
                              title={t('journal.edit')}
                              aria-label={t('journal.edit')}
                              onClick={() => onEdit(r)}
                              className="text-muted hover:bg-neutral-soft hover:text-ink rounded-lg p-1.5 transition-colors"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              title={t('journal.delete')}
                              aria-label={t('journal.delete')}
                              onClick={() => setDeleting(r)}
                              className="text-muted hover:bg-danger-soft hover:text-danger rounded-lg p-1.5 transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {open && (
                      <tr className="bg-canvas/60">
                        <td />
                        <td colSpan={8} className="px-4 pb-4">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="text-muted w-20 py-2 text-start text-[11px] font-bold">
                                  {t('tree.code')}
                                </th>
                                <th className="text-muted py-2 text-start text-[11px] font-bold">
                                  {t('journal.account')}
                                </th>
                                <th className="text-muted py-2 text-start text-[11px] font-bold">
                                  {t('entries.debit')}
                                </th>
                                <th className="text-muted py-2 text-start text-[11px] font-bold">
                                  {t('entries.credit')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.lines.map((l, i) => (
                                <tr key={i} className="border-line border-t">
                                  <td className="text-ink-2 py-2 text-xs tabular-nums">{l.code}</td>
                                  <td className="text-ink py-2 text-xs font-semibold">{accountName(l)}</td>
                                  <td className="text-ink-2 py-2 text-xs tabular-nums">
                                    {l.debit ? num(l.debit) : '—'}
                                  </td>
                                  <td className="text-ink-2 py-2 text-xs tabular-nums">
                                    {l.credit ? num(l.credit) : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="border-line border-t p-4">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t('journal.deleteTitle', { number: deleting?.ref ?? '' })}
        description={t('journal.deleteDescription')}
        cancelLabel={t('close.cancel')}
        confirmLabel={t('journal.delete')}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
