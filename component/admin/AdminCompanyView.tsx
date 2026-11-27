// component/admin/AdminCompanyView.tsx
// One company, as Mizan's staff see it: its plan and how close it is to the limits,
// its team and how they sign in, how much it uses each part of Mizan, how active it
// has been, and what it paid Mizan. Counts only: nothing from inside the company.
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, BadgeCheck, CircleOff, Loader2, Monitor } from 'lucide-react';

import PageHeader from '@/component/PageHeader';
import { thClass } from '@/component/table-styles';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useAdminCompany, type AdminCompanyDetail } from '@/lib/admin/hooks';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useSession } from '@/lib/auth/session';
import { PLAN_CURRENCY } from '@/lib/billing/hooks';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import ActivateSubscriptionDialog from './ActivateSubscriptionDialog';
import EndSubscriptionDialog from './EndSubscriptionDialog';
import { PlanBadge, useCount, useLastActive, useShortDate, useSubscriptionNote } from './admin-ui';

const USAGE_KEYS = ['customers', 'invoices', 'quotes', 'payments', 'expenses', 'products', 'recurring', 'deals', 'tasks', 'employees'] as const;

const card = 'rounded-card border-line bg-surface border p-5 shadow-sm';

export default function AdminCompanyView({ id }: { id: string }) {
  const user = useSession();
  const t = useTranslations('Admin');
  if (!user.isPlatformAdmin) {
    return <p className="text-muted py-20 text-center text-sm">{t('notFound')}</p>;
  }
  return <CompanyLoader id={id} />;
}

function CompanyLoader({ id }: { id: string }) {
  const t = useTranslations('Admin');
  const errorMessage = useApiErrorMessage();
  const { data, error, isPending } = useAdminCompany(id);

  if (isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-muted text-sm">{missing ? t('company.missing') : errorMessage(error)}</p>
        <BackLink />
      </div>
    );
  }
  return <Company data={data} />;
}

function BackLink() {
  const t = useTranslations('Admin.company');
  return (
    <Link
      href="/admin"
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold',
      )}
    >
      <ArrowLeft className="size-4 rtl:rotate-180" />
      {t('back')}
    </Link>
  );
}

function Company({ data }: { data: AdminCompanyDetail }) {
  const t = useTranslations('Admin.company');
  const date = useShortDate();
  const { company } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={company.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PlanBadge plan={data.plan.id} />
            <span>{t('joined', { date: date(company.createdAt) })}</span>
          </span>
        }
        actions={<BackLink />}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Usage data={data} />
          <Members data={data} />
          <Billing data={data} />
        </div>
        <aside className="space-y-5">
          <Plan data={data} />
          <Details data={data} />
        </aside>
      </div>
    </div>
  );
}

function Usage({ data }: { data: AdminCompanyDetail }) {
  const t = useTranslations('Admin.company');
  const n = useCount();
  const activeDays = data.activity.days.filter((d) => d.count > 0).length;
  const actions = data.activity.days.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className={card}>
      <h2 className="text-ink text-base font-extrabold">{t('usageTitle')}</h2>
      <p className="text-muted mt-1 text-xs leading-5">
        {t('activity', { days: n(activeDays), actions: n(actions) })}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {USAGE_KEYS.map((key) => (
          <div key={key} className="bg-canvas/70 rounded-xl px-3 py-2.5">
            <dt className="text-muted text-xs font-semibold">{t(`usage.${key}`)}</dt>
            <dd className="text-ink mt-1 text-lg font-extrabold tabular-nums">
              {n(data.usage[key])}
              {key === 'invoices' && (
                <span className="text-muted ms-1 text-xs font-semibold">
                  {t('thisMonth', { count: n(data.usage.invoicesThisMonth) })}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Members({ data }: { data: AdminCompanyDetail }) {
  const t = useTranslations('Admin.company');
  const tRoles = useTranslations('Admin.roles');
  const lastActive = useLastActive();

  return (
    <section className={cn(card, 'p-0')}>
      <h2 className="text-ink px-5 pt-5 text-base font-extrabold">{t('membersTitle', { count: data.members.length })}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-canvas/60">
            <tr>
              <th className={thClass}>{t('member')}</th>
              <th className={thClass}>{t('role')}</th>
              <th className={thClass}>{t('signIn')}</th>
              <th className={thClass}>{t('lastActive')}</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {data.members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <span className="text-ink block font-bold">{m.fullName}</span>
                  <span dir="ltr" className="text-muted block text-start text-xs">
                    {m.email}
                  </span>
                  {!m.emailVerified && <span className="text-amber-700 text-xs font-semibold">{t('unverified')}</span>}
                </td>
                <td className="text-body px-4 py-3 whitespace-nowrap">{tRoles(m.role)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {m.password && <Tag>{t('methods.password')}</Tag>}
                    {m.google && <Tag>Google</Tag>}
                    {m.desktop && (
                      <Tag>
                        <Monitor className="size-3" aria-hidden="true" />
                        {t('methods.desktop')}
                      </Tag>
                    )}
                  </div>
                </td>
                <td className="text-body px-4 py-3 whitespace-nowrap">{lastActive(m.lastActiveAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-canvas text-ink-2 ring-line inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1">
      {children}
    </span>
  );
}

function Billing({ data }: { data: AdminCompanyDetail }) {
  const t = useTranslations('Admin.company');
  const tPlans = useTranslations('Admin.plans');
  const money = useMoney({ cents: true });
  const date = useShortDate();

  return (
    <section className={cn(card, 'p-0')}>
      <h2 className="text-ink px-5 pt-5 text-base font-extrabold">{t('billingTitle')}</h2>
      {data.billing.length === 0 ? (
        <p className="text-muted px-5 pt-2 pb-5 text-sm">{t('noBilling')}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-canvas/60">
              <tr>
                <th className={thClass}>{t('billing.number')}</th>
                <th className={thClass}>{t('billing.what')}</th>
                <th className={thClass}>{t('billing.amount')}</th>
                <th className={thClass}>{t('billing.status')}</th>
                <th className={thClass}>{t('billing.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {data.billing.map((b) => (
                <tr key={b.number}>
                  <td dir="ltr" className="text-ink px-4 py-3 text-start font-semibold">
                    {b.number}
                  </td>
                  <td className="text-body px-4 py-3">
                    {t(`billing.kinds.${b.kind}`, { plan: tPlans(b.plan) })}
                    {b.automatic && <span className="text-muted block text-xs">{t('billing.automatic')}</span>}
                    {b.manual && (
                      <span className="text-muted block text-xs">
                        {b.note ? t('billing.manualNote', { note: b.note }) : t('billing.manual')}
                      </span>
                    )}
                  </td>
                  <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">
                    {money(Number(b.amount), b.currency || PLAN_CURRENCY)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs font-bold',
                        b.status === 'paid' ? 'text-brand-deep' : b.status === 'failed' ? 'text-danger' : 'text-amber-700',
                      )}
                    >
                      {t(`billing.statuses.${b.status}`)}
                    </span>
                  </td>
                  <td className="text-muted px-4 py-3 whitespace-nowrap">{date(b.paidAt ?? b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Plan({ data }: { data: AdminCompanyDetail }) {
  const t = useTranslations('Admin.company');
  const tPlans = useTranslations('Admin.plans');
  const money = useMoney();
  const n = useCount();
  const date = useShortDate();
  const subscriptionNote = useSubscriptionNote();
  const s = data.subscription;
  const note = subscriptionNote(s);
  const meter = (used: number, limit: number | null) => (limit === null ? null : Math.min(100, Math.round((used / limit) * 100)));
  const [activateOpen, setActivateOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const running = s !== null && s.status !== 'ended';

  return (
    <section className={card}>
      <h2 className="text-ink text-base font-extrabold">{t('planTitle')}</h2>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-ink text-xl font-extrabold">{tPlans(data.plan.id)}</span>
        <span className="text-muted text-sm font-semibold">
          {data.plan.price > 0 ? t('perMonth', { price: money(data.plan.price, PLAN_CURRENCY) }) : t('free')}
        </span>
      </div>
      {note && (
        <p className={cn('mt-1 text-xs font-semibold', note.tone === 'danger' ? 'text-danger' : note.tone === 'warning' ? 'text-amber-700' : 'text-muted')}>
          {note.text}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {[
          { label: t('limits.users'), used: data.plan.users.used, limit: data.plan.users.limit },
          { label: t('limits.invoices'), used: data.plan.invoicesThisMonth.used, limit: data.plan.invoicesThisMonth.limit },
        ].map((row) => {
          const percent = meter(row.used, row.limit);
          return (
            <div key={row.label}>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted">{row.label}</span>
                <span className="text-ink tabular-nums">
                  {row.limit === null ? t('limits.unlimited', { used: n(row.used) }) : t('limits.of', { used: n(row.used), limit: n(row.limit) })}
                </span>
              </div>
              {percent !== null && (
                <div className="bg-canvas mt-1.5 h-1.5 overflow-hidden rounded-full" role="presentation">
                  <div className={cn('h-full rounded-full', percent >= 100 ? 'bg-danger' : 'bg-brand')} style={{ width: `${percent}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {s && s.status !== 'ended' && (
        <dl className="border-line mt-4 space-y-2 border-t pt-4 text-xs">
          <Row label={t('period')} value={`${date(s.currentPeriodStart)} – ${date(s.currentPeriodEnd)}`} />
          {s.nextPlan && <Row label={t('nextPlan')} value={tPlans(s.nextPlan)} />}
          <Row label={t('card')} value={s.card ? `${s.card.brand ?? ''} ${s.card.masked}`.trim() : t('noCard')} ltr={!!s.card} />
          {s.renewalAttempts > 0 && <Row label={t('renewalAttempts')} value={n(s.renewalAttempts)} />}
        </dl>
      )}

      {/* A plan paid outside Paymob (cash, a transfer). */}
      <Button
        type="button"
        onClick={() => setActivateOpen(true)}
        className="rounded-btn bg-brand hover:bg-brand/90 mt-4 h-11 w-full gap-2 text-sm font-bold text-white"
      >
        <BadgeCheck className="size-4" />
        {running ? t('extend') : t('activate')}
      </Button>
      <ActivateSubscriptionDialog company={data} open={activateOpen} onOpenChange={setActivateOpen} />
      {running && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEndOpen(true)}
            className="rounded-btn border-line-strong bg-surface text-danger hover:bg-danger-soft hover:text-danger mt-2 h-10 w-full gap-2 text-sm font-bold"
          >
            <CircleOff className="size-4" />
            {t('end')}
          </Button>
          <EndSubscriptionDialog company={data} open={endOpen} onOpenChange={setEndOpen} />
        </>
      )}
    </section>
  );
}

function Details({ data }: { data: AdminCompanyDetail }) {
  const t = useTranslations('Admin.company');
  const { company } = data;
  const rows = [
    { label: t('details.phone'), value: company.phone, ltr: true },
    { label: t('details.address'), value: company.address },
    { label: t('details.taxNumber'), value: company.taxNumber, ltr: true },
    { label: t('details.commercialRegister'), value: company.commercialRegister, ltr: true },
    { label: t('details.currency'), value: company.currency, ltr: true },
  ];
  return (
    <section className={card}>
      <h2 className="text-ink text-base font-extrabold">{t('detailsTitle')}</h2>
      <dl className="mt-3 space-y-2 text-xs">
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value || '—'} ltr={!!r.value && r.ltr} />
        ))}
      </dl>
    </section>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined} className="text-ink min-w-0 text-end font-semibold break-words">
        {value}
      </dd>
    </div>
  );
}
