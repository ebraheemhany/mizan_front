// component/dashbord/audit-log/AuditLogView.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import {
  AUDIT_ENTRIES,
  AUDIT_NOW,
  AUDIT_USERS,
  type AuditAction,
  type AuditEntry,
} from '@/lib/mock/audit-log';
import { Link } from '@/i18n/navigation';
import PageHeader from '@/component/PageHeader';
import Pagination from '@/component/dashbord/Pagination';
import AuditFilter from './AuditFilter';

const PAGE_SIZE = 7;
const DAY_MS = 86_400_000;

const ACTIONS: AuditAction[] = [
  'create',
  'update',
  'payment',
  'send',
  'delete',
  'permissions',
  'login',
];

const PERIODS = { d7: 7, d30: 30, d90: 90 } as const;
type Period = keyof typeof PERIODS;

const ACTION_STYLES: Partial<Record<AuditAction, string>> = {
  delete: 'bg-danger-soft text-danger',
};

const th =
  'bg-canvas text-muted px-4 py-3 text-start text-xs font-bold whitespace-nowrap';
const td = 'px-4 py-3.5 text-xs';

// وجهة العنصر: فاتورة وعميل بس. المصروف والحساب والمستخدم مفيش لهم صفحة
// TODO: لما نربط الـ API الـ id يجي من السيرفر
function itemHref(item: AuditEntry['item']) {
  if (!item.id) return null;
  if (item.type === 'invoice') return `/invoices/${item.id}`;
  if (item.type === 'customer') return `/customers/${item.id}`;
  return null;
}

export default function AuditLogView() {
  const t = useTranslations('AuditLog');
  const format = useFormatter();
  const money = useMoney();

  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('all');
  const [action, setAction] = useState('all');
  const [period, setPeriod] = useState<Period>('d30');
  const [requestedPage, setPage] = useState(1);

  const userName = (id: string) =>
    id === 'system'
      ? t('system')
      : (AUDIT_USERS.find((u) => u.id === id)?.name ?? id);

  const dayLabel = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  const timeLabel = (iso: string) =>
    format.dateTime(new Date(iso), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  // كل صف بعد الترجمة (علشان البحث والتصدير يشتغلوا على النص الظاهر)
  const rows = AUDIT_ENTRIES.map((e) => ({
    ...e,
    userLabel: userName(e.user),
    actionLabel: t(`actions.${e.action}`),
    itemLabel: t(`items.${e.item.type}`, { ref: e.item.ref ?? '' }),
    detailLabel: t(`details.${e.detail.key}`, {
      amount: money(e.detail.amount ?? 0),
      name: e.detail.name ?? '',
    }),
  }));

  const since = Date.parse(AUDIT_NOW) - PERIODS[period] * DAY_MS;
  const q = search.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    if (Date.parse(r.at) < since) return false;
    if (userId !== 'all' && r.user !== userId) return false;
    if (action !== 'all' && r.action !== action) return false;
    if (!q) return true;
    return `${r.userLabel} ${r.itemLabel} ${r.detailLabel} ${r.ip ?? ''}`
      .toLowerCase()
      .includes(q);
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

  // TODO: بدّله بـ lib/export-csv.ts لو شكله مناسب
  const handleExport = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      t('columns.time'),
      t('columns.user'),
      t('columns.action'),
      t('columns.item'),
      t('columns.details'),
      t('columns.ip'),
    ];
    const lines = filtered.map((r) =>
      [
        `${dayLabel(r.at)} ${timeLabel(r.at)}`,
        r.userLabel,
        r.actionLabel,
        r.itemLabel,
        r.detailLabel,
        r.ip ?? '',
      ]
        .map(cell)
        .join(','),
    );
    const csv = '\uFEFF' + [header.map(cell).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      t('exported', {
        count: format.number(filtered.length, { numberingSystem: 'latn' }),
      }),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn flex h-10 items-center gap-2 border px-4 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Download className="size-4" />
            {t('export')}
          </button>
        }
      />

      <div className="rounded-card border-line bg-surface border shadow-sm">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="text-muted pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => withReset(setSearch)(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="border-line-strong placeholder:text-muted focus-visible:ring-brand/30 rounded-btn h-11 w-full border bg-transparent ps-10 pe-4 text-xs outline-none focus-visible:ring-2"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <AuditFilter
              ariaLabel={t('filters.userLabel')}
              value={userId}
              onChange={withReset(setUserId)}
              options={[
                { value: 'all', label: t('filters.allUsers') },
                ...AUDIT_USERS.map((u) => ({
                  value: u.id,
                  label: userName(u.id),
                })),
              ]}
            />
            <AuditFilter
              ariaLabel={t('filters.actionLabel')}
              value={action}
              onChange={withReset(setAction)}
              options={[
                { value: 'all', label: t('filters.allActions') },
                ...ACTIONS.map((a) => ({ value: a, label: t(`actions.${a}`) })),
              ]}
            />
            <AuditFilter
              ariaLabel={t('filters.periodLabel')}
              value={period}
              onChange={(v) => withReset(setPeriod)(v as Period)}
              options={(Object.keys(PERIODS) as Period[]).map((p) => ({
                value: p,
                label: t(`filters.period.${p}`),
              }))}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t('columns.time')}</th>
                <th className={th}>{t('columns.user')}</th>
                <th className={th}>{t('columns.action')}</th>
                <th className={th}>{t('columns.item')}</th>
                <th className={th}>{t('columns.details')}</th>
                <th className={th}>{t('columns.ip')}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted py-12 text-center text-sm"
                  >
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const href = itemHref(r.item);

                  return (
                    <tr key={r.id} className="border-line border-t">
                      <td className={cn(td, 'text-ink-2 whitespace-nowrap')}>
                        {dayLabel(r.at)} · {timeLabel(r.at)}
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          <span className="bg-brand-soft text-brand-deep flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                            {Array.from(r.userLabel)[0]}
                          </span>
                          <span className="text-ink font-semibold">
                            {r.userLabel}
                          </span>
                        </div>
                      </td>
                      <td className={td}>
                        <span
                          className={cn(
                            'bg-neutral-soft text-ink-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold',
                            ACTION_STYLES[r.action],
                          )}
                        >
                          {r.actionLabel}
                        </span>
                      </td>
                      <td className={cn(td, 'text-ink-2')}>
                        {href ? (
                          <Link
                            href={href}
                            className="text-brand hover:text-brand-deep font-semibold hover:underline"
                          >
                            {r.itemLabel}
                          </Link>
                        ) : (
                          r.itemLabel
                        )}
                      </td>
                      <td className={cn(td, 'text-ink-2')}>{r.detailLabel}</td>
                      <td className={cn(td, 'text-muted')}>
                        <span dir="ltr" className="inline-block">
                          {r.ip ?? '—'}
                        </span>
                      </td>
                    </tr>
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
    </div>
  );
}
