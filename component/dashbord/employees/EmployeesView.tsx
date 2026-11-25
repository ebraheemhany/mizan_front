// component/dashbord/employees/EmployeesView.tsx
// The employees page: the cards, the list (active / ended / all, search, department),
// and adding someone. Paid plans; owner and accountant.
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Banknote, Loader2, Plus, Search } from 'lucide-react';

import FilterSelect from '@/component/FilterSelect';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { thClass } from '@/component/table-styles';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useDate } from '@/lib/data';
import { needsPaidPlan, num, useEmployees, useEmployeeStats, type EmployeeListParams } from '@/lib/payroll/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import FilterTabs from '../FilterTabs';
import EmployeeSheet from './EmployeeSheet';
import { EmployeeStatusBadge, outlineBtn, PlanLocked, primaryBtn, usePayMoney } from './shared';

export default function EmployeesView() {
  const user = useSession();
  const tErrors = useTranslations('ApiErrors');
  if (!can(user.role, 'payroll')) return <p className="text-muted text-sm">{tErrors('FORBIDDEN')}</p>;
  return <EmployeesContent />;
}

function EmployeesContent() {
  const t = useTranslations('Employees');
  const money = usePayMoney();
  const date = useDate();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const [status, setStatus] = useState<EmployeeListParams['status']>('active');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [adding, setAdding] = useState(false);
  const q = useDebouncedValue(query.trim(), 300);

  const list = useEmployees({ status, q: q || undefined, department: department === 'all' ? undefined : department });
  const stats = useEmployeeStats(!needsPaidPlan(list.error));

  if (needsPaidPlan(list.error)) return <PlanLocked />;

  const data = list.data;
  const s = stats.data;
  const tabs = (['active', 'ended', 'all'] as const).map((value) => ({
    value,
    label: t(`tabs.${value}`),
    count: data?.counts[value] ?? 0,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Link href="/payroll" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
              <Banknote className="size-4" />
              {t('payroll')}
            </Link>
            <Button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
              <Plus className="size-4" />
              {t('add')}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('stats.active')} value={s ? s.active : '—'} hint={s ? t('stats.activeHint', { leave: s.onLeaveToday, absent: s.absentToday }) : ''} />
        <StatCard label={t('stats.monthlyNet')} value={s ? money(s.monthlyNet) : '—'} hint={t('stats.monthlyNetHint')} tone="brand" />
        <StatCard label={t('stats.monthlyCost')} value={s ? money(s.monthlyCost) : '—'} hint={t('stats.monthlyCostHint')} />
        <StatCard
          label={t('stats.advances')}
          value={s ? money(s.advancesOutstanding) : '—'}
          hint={t('stats.advancesHint')}
          tone={s && num(s.advancesOutstanding) > 0 ? 'warning' : 'default'}
        />
      </div>

      <FilterTabs value={status} tabs={tabs} onChange={setStatus} />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="text-muted pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="rounded-btn border-line-strong bg-surface h-10 ps-9 text-sm"
            />
          </div>
          {(data?.departments.length ?? 0) > 0 && (
            <FilterSelect
              value={department}
              prefix={t('department')}
              options={[{ value: 'all', label: t('allDepartments') }, ...data!.departments.map((d) => ({ value: d, label: d }))]}
              onChange={setDepartment}
            />
          )}
        </div>

        {list.isPending ? (
          <div className="border-line text-muted flex justify-center border-t py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : list.isError ? (
          <p className="border-line text-danger border-t px-4 py-14 text-center text-sm font-semibold">{errorMessage(list.error)}</p>
        ) : data!.items.length === 0 ? (
          <div className="border-line border-t px-4 py-14 text-center">
            <p className="text-muted text-sm">{q || department !== 'all' ? t('noMatch') : t(`empty.${status}`)}</p>
            {status === 'active' && !q && (
              <Button type="button" onClick={() => setAdding(true)} className={cn(primaryBtn, 'mt-4')}>
                <Plus className="size-4" />
                {t('addFirst')}
              </Button>
            )}
          </div>
        ) : (
          <div className={cn('overflow-x-auto', list.isPlaceholderData && 'opacity-60 transition-opacity')}>
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-canvas/60 border-line border-y">
                <tr>
                  <th className={thClass}>{t('columns.employee')}</th>
                  <th className={thClass}>{t('columns.department')}</th>
                  <th className={thClass}>{t('columns.hireDate')}</th>
                  <th className={cn(thClass, 'text-end')}>{t('columns.net')}</th>
                  <th className={cn(thClass, 'text-end')}>{t('columns.advances')}</th>
                  <th className={thClass}>{t('columns.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {data!.items.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => router.push(`/employees/${e.id}`)}
                    className="hover:bg-canvas/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/employees/${e.id}`} onClick={(ev) => ev.stopPropagation()} className="text-ink font-bold hover:underline">
                        {e.name}
                      </Link>
                      <p className="text-muted mt-0.5 text-xs">
                        <span dir="ltr">{e.ref}</span>
                        {e.jobTitle ? ` · ${e.jobTitle}` : ''}
                      </p>
                    </td>
                    <td className="text-ink-2 px-4 py-3">{e.department ?? '—'}</td>
                    <td className="text-ink-2 px-4 py-3 whitespace-nowrap">{date(e.hireDate)}</td>
                    <td className="text-ink px-4 py-3 text-end font-bold tabular-nums whitespace-nowrap">{money(e.pay.net)}</td>
                    <td className={cn('px-4 py-3 text-end tabular-nums whitespace-nowrap', num(e.advancesOutstanding) > 0 ? 'font-bold text-amber-700' : 'text-muted')}>
                      {num(e.advancesOutstanding) > 0 ? money(e.advancesOutstanding) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <EmployeeStatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeSheet
        open={adding}
        onOpenChange={setAdding}
        employee={null}
        departments={data?.departments ?? []}
        onSaved={(e) => router.push(`/employees/${e.id}`)}
      />
    </div>
  );
}
