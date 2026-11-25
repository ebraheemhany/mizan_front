// component/admin/AdminView.tsx
// The platform admin page (Mizan's own staff): the platform in numbers, then every
// company with its owner, plan and how much it uses Mizan.
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Search } from 'lucide-react';

import FilterSelect from '@/component/FilterSelect';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import FilterTabs from '@/component/dashbord/FilterTabs';
import Pagination from '@/component/dashbord/Pagination';
import { thClass } from '@/component/table-styles';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { useAdminCompanies, useAdminOverview, type AdminSort, type PlanId } from '@/lib/admin/hooks';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useSession } from '@/lib/auth/session';
import { PLAN_CURRENCY } from '@/lib/billing/hooks';
import { useMoney } from '@/lib/money';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import { PlanBadge, useCount, useLastActive, useShortDate, useSubscriptionNote } from './admin-ui';

const SORTS: AdminSort[] = ['newest', 'active', 'usage', 'oldest', 'name'];
const PLAN_TABS: ('all' | PlanId)[] = ['all', 'free', 'pro', 'business'];

/** Only for Mizan's staff; anyone else sees what a missing page shows. */
export default function AdminView() {
  const user = useSession();
  const t = useTranslations('Admin');
  if (!user.isPlatformAdmin) {
    return <p className="text-muted py-20 text-center text-sm">{t('notFound')}</p>;
  }
  return <Admin />;
}

function Admin() {
  const t = useTranslations('Admin');
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <Overview />
      <Companies />
    </div>
  );
}

function Overview() {
  const t = useTranslations('Admin.overview');
  const errorMessage = useApiErrorMessage();
  const money = useMoney();
  const n = useCount();
  const { data, error, isPending } = useAdminOverview();

  if (isPending) {
    return (
      <div className="text-muted flex justify-center py-10">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) return <p className="text-danger text-sm font-semibold">{errorMessage(error)}</p>;

  const egp = (amount: string) => money(Number(amount), data.revenue.currency || PLAN_CURRENCY);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label={t('companies')}
        value={n(data.companies.total)}
        hint={t('companiesHint', { month: n(data.companies.newThisMonth), week: n(data.companies.newLast7Days) })}
      />
      <StatCard
        label={t('active')}
        value={n(data.companies.active7Days)}
        hint={t('activeHint', { month: n(data.companies.active30Days) })}
        tone="brand"
      />
      <StatCard
        label={t('paying')}
        value={n(data.subscriptions.paying)}
        hint={
          data.subscriptions.pastDue > 0
            ? t('pastDueHint', { count: data.subscriptions.pastDue })
            : t('payingHint', { pro: n(data.plans.pro), business: n(data.plans.business), free: n(data.plans.free) })
        }
        hintTone={data.subscriptions.pastDue > 0 ? 'danger' : 'default'}
      />
      <StatCard
        label={t('mrr')}
        value={egp(data.revenue.monthlyRecurring)}
        hint={t('mrrHint', { month: egp(data.revenue.thisMonth), total: egp(data.revenue.total) })}
        tone="brand"
      />
      <StatCard label={t('users')} value={n(data.users)} hint={t('usersHint')} />
      <StatCard
        label={t('desktop')}
        value={n(data.desktopCompanies30Days)}
        hint={t('desktopHint')}
      />
    </div>
  );
}

function Companies() {
  const t = useTranslations('Admin.companies');
  const tPlans = useTranslations('Admin.plans');
  const errorMessage = useApiErrorMessage();
  const n = useCount();
  const date = useShortDate();
  const lastActive = useLastActive();
  const subscriptionNote = useSubscriptionNote();

  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState<'all' | PlanId>('all');
  const [sort, setSort] = useState<AdminSort>('newest');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search);
  const { data, error, isPending, isPlaceholderData } = useAdminCompanies({ q, plan, sort, page });

  return (
    <section className="rounded-card border-line bg-surface border shadow-sm">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-ink text-lg font-extrabold">{t('title')}</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative sm:w-72">
              <Search className="text-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('search')}
                aria-label={t('search')}
                className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-10 pe-9 text-sm"
              />
            </div>
            <FilterSelect
              value={sort}
              prefix={t('sortLabel')}
              options={SORTS.map((s) => ({ value: s, label: t(`sort.${s}`) }))}
              onChange={(value) => {
                setSort(value as AdminSort);
                setPage(1);
              }}
            />
          </div>
        </div>
        <FilterTabs
          value={plan}
          tabs={PLAN_TABS.map((p) => ({ value: p, label: p === 'all' ? t('all') : tPlans(p), count: data?.counts[p] ?? 0 }))}
          onChange={(value) => {
            setPlan(value);
            setPage(1);
          }}
        />
      </div>

      {isPending ? (
        <div className="text-muted border-line flex justify-center border-t py-14">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : error || !data ? (
        <p className="text-danger border-line border-t px-4 py-10 text-center text-sm font-semibold">{errorMessage(error)}</p>
      ) : data.companies.length === 0 ? (
        <p className="text-muted border-line border-t px-4 py-14 text-center text-sm">{t('empty')}</p>
      ) : (
        <div className={cn('border-line border-t', isPlaceholderData && 'opacity-60 transition-opacity')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-canvas/60">
                <tr>
                  <th className={thClass}>{t('columns.company')}</th>
                  <th className={thClass}>{t('columns.plan')}</th>
                  <th className={thClass}>{t('columns.users')}</th>
                  <th className={thClass}>{t('columns.customers')}</th>
                  <th className={thClass}>{t('columns.invoices')}</th>
                  <th className={thClass}>{t('columns.lastActive')}</th>
                  <th className={thClass}>{t('columns.joined')}</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {data.companies.map((c) => {
                  const note = subscriptionNote(c.subscription);
                  return (
                    <tr key={c.id} className="hover:bg-canvas/60 transition-colors">
                      <td className="max-w-72 px-4 py-3">
                        <Link href={`/admin/companies/${c.id}`} className="text-ink block truncate font-bold hover:underline">
                          {c.name}
                        </Link>
                        {c.owner && (
                          <span dir="ltr" className="text-muted block truncate text-start text-xs">
                            {c.owner.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={c.plan} />
                        {note && (
                          <span
                            className={cn(
                              'mt-1 block text-xs font-semibold',
                              note.tone === 'danger' ? 'text-danger' : note.tone === 'warning' ? 'text-amber-700' : 'text-muted',
                            )}
                          >
                            {note.text}
                          </span>
                        )}
                      </td>
                      <td className="text-ink px-4 py-3 tabular-nums">{n(c.users)}</td>
                      <td className="text-ink px-4 py-3 tabular-nums">{n(c.customers)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="text-ink font-bold">{n(c.invoicesThisMonth)}</span>
                        <span className="text-muted text-xs"> {t('invoicesOf', { total: n(c.invoices) })}</span>
                      </td>
                      <td className="text-body px-4 py-3 whitespace-nowrap">{lastActive(c.lastActiveAt)}</td>
                      <td className="text-muted px-4 py-3 whitespace-nowrap">{date(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}
