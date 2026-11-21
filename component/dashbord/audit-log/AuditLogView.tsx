// component/dashbord/audit-log/AuditLogView.tsx
'use client';

import { useDeferredValue, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Download, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/component/PageHeader';
import Pagination from '@/component/dashbord/Pagination';
import { downloadCsv, useMonthLabel } from '@/component/dashbord/accounts/ledger-ui';
import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import {
  AUDIT_ACTIONS,
  AUDIT_PERIODS,
  fetchAuditExport,
  useAuditLog,
  type AuditAction,
  type AuditLine,
  type AuditPeriod,
} from '@/lib/audit/hooks';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import AuditFilter from './AuditFilter';

const PAGE_SIZE = 20;

const ACTION_STYLES: Partial<Record<AuditAction, string>> = {
  delete: 'bg-danger-soft text-danger',
  cancel: 'bg-danger-soft text-danger',
  permissions: 'bg-info-soft text-info',
  login: 'bg-info-soft text-info',
  payment: 'bg-brand-soft text-brand-deep',
};

const th = 'bg-canvas text-muted px-4 py-3 text-start text-xs font-bold whitespace-nowrap';
const td = 'px-4 py-3.5 text-xs';

/** Where the line's item lives in the app (none for a deleted one or a sign-in). */
function itemHref(line: AuditLine) {
  const { type, id } = line.item;
  const number = line.values['number'];
  if (type === 'invoice') return number != null ? `/invoices/${number}` : id ? `/invoices/${id}` : null;
  if (type === 'quote') return number != null ? `/quotes/${number}` : id ? `/quotes/${id}` : null;
  if (type === 'customer') return id ? `/customers/${id}` : null;
  if (type === 'recurring') return id ? `/invoices/recurring/${id}/edit` : null;
  if (type === 'expense') return '/expenses';
  if (type === 'product') return '/products';
  if (type === 'entry' || type === 'ledgerAccount' || type === 'period') return '/accounts';
  if (type === 'user') return '/settings';
  if (type === 'deal') return '/deals';
  return null;
}

/** The texts of a line: what happened, to what, by whom. */
function useAuditText() {
  const t = useTranslations('AuditLog');
  const tRoles = useTranslations('Settings.users.roles');
  const tCategories = useTranslations('Expenses.categories');
  const tFrequency = useTranslations('Recurring.frequency');
  const tTypes = useTranslations('Accounts.types');
  const money = useMoney();
  const monthLabel = useMonthLabel();
  const format = useFormatter();

  const tMethods = useTranslations('AuditLog.methods');
  const tChannels = useTranslations('AuditLog.channels');
  const tFields = useTranslations('AuditLog.fields');
  const tSections = useTranslations('AuditLog.sections');
  const tStages = useTranslations('Deals.stages');
  const tReasons = useTranslations('Deals.lost.reasons');
  const tPlans = useTranslations('Settings.subscription.plans');

  // A value from the log, through the app's words for it when there are some.
  type Words = { has: (key: string) => boolean; (key: string): string };
  const word = (ns: Words, value: unknown) => {
    const key = value == null ? '' : String(value);
    return key && ns.has(key) ? ns(key) : key;
  };
  const list = (value: unknown, ns: Words) =>
    Array.isArray(value) ? value.map((v) => word(ns, v)).join('، ') : '';
  const day = (iso: unknown) =>
    typeof iso === 'string' && iso
      ? format.dateTime(new Date(`${iso.slice(0, 10)}T00:00:00Z`), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          numberingSystem: 'latn',
          timeZone: 'UTC',
        })
      : '';

  const details = (line: AuditLine) => {
    const v = line.values;
    const values = {
      amount: v['amount'] != null ? money(Number(v['amount'])) : '',
      price: v['price'] != null ? money(Number(v['price'])) : '',
      customer: String(v['customer'] ?? ''),
      payment: String(v['payment'] ?? ''),
      method: word(tMethods, v['method']),
      role: word(tRoles, v['role']),
      from: line.event === 'roleChanged' ? word(tRoles, v['from']) : String(v['from'] ?? ''),
      email: String(v['email'] ?? ''),
      // Who an email went to (reminders by WhatsApp have none).
      to: v['to'] == null ? 'none' : String(v['to']),
      name: v['name'] == null ? 'none' : String(v['name']),
      count: Number(v['count'] ?? 0),
      fields: list(v['fields'], tFields),
      sections: list(v['sections'], tSections),
      category: word(tCategories, v['category']),
      frequency: word(tFrequency, v['frequency']),
      type: word(tTypes, v['type']),
      code: String(v['code'] ?? ''),
      memo: String(v['memo'] ?? ''),
      month: typeof v['month'] === 'string' ? monthLabel(v['month']) : '',
      through: day(v['through']),
      channel: word(tChannels, v['channel']),
      fromStage: word(tStages, v['from']),
      toStage: word(tStages, v['stage']),
      reason: word(tReasons, v['reason']),
      plan: word(tPlans, v['plan']),
      // Why a subscription ended (unpaid / canceled).
      why: String(v['why'] ?? ''),
    };
    return t.has(`events.${line.event}`) ? t(`events.${line.event}`, values) : line.event;
  };

  const item = (line: AuditLine) => {
    const { type, ref } = line.item;
    if (!ref) return t.has(`itemTypes.${type}`) ? t(`itemTypes.${type}`) : type;
    const shown = type === 'period' ? monthLabel(ref) : ref;
    return t.has(`items.${type}`) ? t(`items.${type}`, { ref: shown }) : shown;
  };

  const who = (line: AuditLine) => line.user?.name ?? t('system');

  return { details, item, who };
}

export default function AuditLogView() {
  const t = useTranslations('AuditLog');
  const tErrors = useTranslations('ApiErrors');
  const user = useSession();
  if (!can(user.role, 'auditLog')) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>
      </div>
    );
  }
  return <AuditLog />;
}

function AuditLog() {
  const t = useTranslations('AuditLog');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const text = useAuditText();

  const [search, setSearch] = useState('');
  const q = useDeferredValue(search.trim());
  const [userId, setUserId] = useState('all');
  const [action, setAction] = useState<'all' | AuditAction>('all');
  const [period, setPeriod] = useState<AuditPeriod>('d30');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const filters = { q, userId, action, period };
  const log = useAuditLog({ ...filters, page, pageSize: PAGE_SIZE });
  const rows = log.data?.items ?? [];
  const total = log.data?.total ?? 0;

  // Any filter change goes back to the first page.
  const withReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  // Times as in Egypt, whatever the device's zone.
  const when = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      numberingSystem: 'latn',
      timeZone: 'Africa/Cairo',
    });

  async function handleExport() {
    setExporting(true);
    try {
      const { items, limited } = await fetchAuditExport(filters);
      downloadCsv(
        'audit-log.csv',
        [t('columns.time'), t('columns.user'), t('columns.action'), t('columns.item'), t('columns.details'), t('columns.ip')],
        items.map((line) => [
          when(line.at),
          text.who(line),
          t(`actions.${line.action}`),
          text.item(line),
          text.details(line),
          line.ip ?? '',
        ]),
      );
      toast.success(
        t(limited ? 'exportedLimited' : 'exported', {
          count: format.number(items.length, { numberingSystem: 'latn' }),
        }),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={total === 0 || exporting}
            className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn flex h-10 items-center gap-2 border px-4 text-xs font-bold transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
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
              maxLength={100}
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
                ...(log.data?.users ?? []).map((u) => ({ value: u.id, label: u.name })),
                { value: 'system', label: t('filters.system') },
              ]}
            />
            <AuditFilter
              ariaLabel={t('filters.actionLabel')}
              value={action}
              onChange={withReset((v: string) => setAction(v as 'all' | AuditAction))}
              options={[
                { value: 'all', label: t('filters.allActions') },
                ...AUDIT_ACTIONS.map((a) => ({ value: a, label: t(`actions.${a}`) })),
              ]}
            />
            <AuditFilter
              ariaLabel={t('filters.periodLabel')}
              value={period}
              onChange={withReset((v: string) => setPeriod(v as AuditPeriod))}
              options={AUDIT_PERIODS.map((p) => ({ value: p, label: t(`filters.period.${p}`) }))}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
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
              {log.isPending ? (
                <tr>
                  <td colSpan={6} className="text-muted py-12 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : log.isError ? (
                <tr>
                  <td colSpan={6} className="text-danger py-12 text-center text-sm font-semibold">
                    {errorMessage(log.error)}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted py-12 text-center text-sm">
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                rows.map((line) => {
                  const href = itemHref(line);
                  const name = text.who(line);
                  return (
                    <tr key={line.id} className="border-line border-t">
                      <td className={cn(td, 'text-ink-2 whitespace-nowrap')}>{when(line.at)}</td>
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              line.user ? 'bg-brand-soft text-brand-deep' : 'bg-neutral-soft text-ink-2',
                            )}
                          >
                            {Array.from(name)[0]}
                          </span>
                          <span className="min-w-0">
                            <span className="text-ink block font-semibold">{name}</span>
                            {line.values['viaLink'] === true && (
                              <span className="text-muted block text-[11px]">{t('viaLink')}</span>
                            )}
                            {line.user && !line.user.id && line.values['viaLink'] !== true && (
                              <span className="text-muted block text-[11px]">{t('removedUser')}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className={td}>
                        <span
                          className={cn(
                            'bg-neutral-soft text-ink-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap',
                            ACTION_STYLES[line.action],
                          )}
                        >
                          {t(`actions.${line.action}`)}
                        </span>
                      </td>
                      <td className={cn(td, 'text-ink-2 max-w-[14rem]')}>
                        {href ? (
                          <Link href={href} className="text-brand hover:text-brand-deep font-semibold hover:underline">
                            {text.item(line)}
                          </Link>
                        ) : (
                          text.item(line)
                        )}
                      </td>
                      <td className={cn(td, 'text-ink-2 max-w-[22rem]')}>{text.details(line)}</td>
                      <td className={cn(td, 'text-muted')}>
                        <span dir="ltr" className="inline-block">
                          {line.ip ?? '—'}
                        </span>
                      </td>
                    </tr>
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
      </div>
    </div>
  );
}
