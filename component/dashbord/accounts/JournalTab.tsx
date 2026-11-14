// component/dashbord/accounts/JournalTab.tsx
'use client';

import { Fragment, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronDown, CircleDot, Layers, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
// import {
//   JOURNAL,
//   entryTotals,
//   type EntryDesc,
//   type EntrySource,
//   type EntryStatus,
// } from '@/lib/mock/accounts';
import Pagination from '@/component/dashbord/Pagination';
import FilterPopover from '@/component/dashbord/FilterPopover';
import {
  entryTotals,
  type EntryDesc,
  type EntrySource,
  type EntryStatus,
  type JournalEntry,
} from '@/lib/mock/accounts';
const PAGE_SIZE = 8;
const SOURCES: EntrySource[] = [
  'invoice',
  'payment',
  'expense',
  'payroll',
  'manual',
];
const STATUSES: EntryStatus[] = ['posted', 'draft'];

const STATUS_STYLES: Record<EntryStatus, string> = {
  posted: 'bg-brand-soft text-brand-deep',
  draft: 'bg-neutral-soft text-ink-2',
};

const card = 'rounded-card border-line bg-surface border shadow-sm';
const th =
  'bg-canvas text-muted px-4 py-3 text-start text-xs font-bold whitespace-nowrap';
const td = 'px-4 py-3.5 text-xs';

export default function JournalTab({ entries }: { entries: JournalEntry[] }) {
  const t = useTranslations('Accounts');
  const format = useFormatter();

  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('all');
  const [requestedPage, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const num = (n: number) => format.number(n, { numberingSystem: 'latn' });

  const fmtDay = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  const fmtMonth = (iso: string) =>
    format.dateTime(new Date(iso), { month: 'long', timeZone: 'UTC' });

  const entryText = (d: EntryDesc) =>
    t(`entries.${d.key}`, {
      ref: d.ref ?? '',
      month: d.month ? fmtMonth(d.month) : '',
      text: d.text ?? '',
    });

  const rows = entries.map((e) => ({ ...e, text: entryText(e.desc) }));
  const q = search.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    if (source !== 'all' && r.source !== source) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (!q) return true;
    return `${r.number} ${r.text}`.toLowerCase().includes(q);
  });

  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // أي تغيير في الفلاتر يرجّع للصفحة الأولى
  const withReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  return (
    <div className={card}>
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="text-muted pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => withReset(setSearch)(e.target.value)}
            placeholder={t('journal.searchPlaceholder')}
            className="border-line-strong placeholder:text-muted focus-visible:ring-brand/30 rounded-btn h-11 w-full border bg-transparent ps-10 pe-4 text-xs outline-none focus-visible:ring-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPopover
            icon={Layers}
            label={t('journal.sourceLabel')}
            value={source}
            allValue="all"
            onChange={withReset(setSource)}
            options={[
              { value: 'all', label: t('journal.allSources') },
              ...SOURCES.map((s) => ({
                value: s,
                label: t(`journal.sources.${s}`),
              })),
            ]}
          />
          <FilterPopover
            icon={CircleDot}
            label={t('journal.statusLabel')}
            value={status}
            allValue="all"
            onChange={withReset(setStatus)}
            options={[
              { value: 'all', label: t('journal.allStatuses') },
              ...STATUSES.map((s) => ({
                value: s,
                label: t(`journal.status.${s}`),
              })),
            ]}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
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
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted py-12 text-center text-sm"
                >
                  {t('journal.empty')}
                </td>
              </tr>
            ) : (
              pageRows.map((r) => {
                const { debit, credit } = entryTotals(r);
                const open = openId === r.id;

                return (
                  <Fragment key={r.id}>
                    <tr className="border-line border-t">
                      <td className="ps-3">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={t('journal.toggleLines')}
                          onClick={() => setOpenId(open ? null : r.id)}
                          className="text-muted hover:text-ink flex size-7 items-center justify-center"
                        >
                          <ChevronDown
                            className={cn(
                              'size-4 transition-transform',
                              open && 'rotate-180',
                            )}
                          />
                        </button>
                      </td>
                      <td className={cn(td, 'text-brand font-bold')}>
                        <span dir="ltr" className="inline-block">
                          {r.number}
                        </span>
                      </td>
                      <td className={cn(td, 'text-ink-2 whitespace-nowrap')}>
                        {fmtDay(r.date)}
                      </td>
                      <td className={cn(td, 'text-ink-2')}>{r.text}</td>
                      <td className={td}>
                        <span className="bg-neutral-soft text-ink-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold">
                          {t(`journal.sources.${r.source}`)}
                        </span>
                      </td>
                      <td className={cn(td, 'text-ink-2')}>{num(debit)}</td>
                      <td className={cn(td, 'text-ink-2')}>{num(credit)}</td>
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
                    </tr>

                    {open && (
                      <tr className="bg-canvas/60">
                        <td />
                        <td colSpan={7} className="px-4 pb-4">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
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
                                  <td className="text-ink py-2 text-xs font-semibold">
                                    {t(`names.${l.account}`)}
                                  </td>
                                  <td className="text-ink-2 py-2 text-xs">
                                    {l.debit ? num(l.debit) : '—'}
                                  </td>
                                  <td className="text-ink-2 py-2 text-xs">
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

      {filtered.length > 0 && (
        <div className="border-line border-t p-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
