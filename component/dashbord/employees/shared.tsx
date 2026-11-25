// component/dashbord/employees/shared.tsx
// Pieces the employees and payroll pages share: field styles, status badges, the
// "paid plans" card, and money formatting with piastres.
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { IdCard, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useMoney } from '@/lib/money';
import { num, type PayrollStatus } from '@/lib/payroll/hooks';
import { cn } from '@/lib/utils';
import { UpgradePlanDialog } from '../settings/UpgradePlanDialog';

export const fieldClass =
  'rounded-btn border-line-strong bg-surface text-ink placeholder:text-muted hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
export const labelClass = 'text-ink mb-2 block text-sm font-bold';
export const cardClass = 'rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6';
export const primaryBtn = 'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';
export const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

/** "نوفمبر 2026" for "2026-11". */
export function useMonthLabel() {
  const format = useFormatter();
  return (month: string) =>
    format.dateTime(new Date(`${month}-01T00:00:00Z`), { month: 'long', year: 'numeric', numberingSystem: 'latn', timeZone: 'UTC' });
}

/** Money with piastres (salaries are often prorated or divided by days). */
export function usePayMoney() {
  const money = useMoney({ cents: true });
  return (value: string | number | null | undefined) => money(typeof value === 'number' ? value : num(value));
}

const badge = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap';

export function EmployeeStatusBadge({ status }: { status: 'active' | 'ended' }) {
  const t = useTranslations('Employees.status');
  return (
    <span className={cn(badge, status === 'active' ? 'bg-brand-soft text-brand-deep' : 'bg-neutral-soft text-muted')}>
      <i className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}

const PAYROLL_STYLES: Record<PayrollStatus, string> = {
  draft: 'bg-neutral-soft text-muted',
  approved: 'bg-info-soft text-info',
  paid: 'bg-brand-soft text-brand-deep',
};

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const t = useTranslations('Payroll.status');
  return (
    <span className={cn(badge, PAYROLL_STYLES[status])}>
      <i className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}

/** Shown instead of the employees and payroll pages on the free plan. */
export function PlanLocked() {
  const t = useTranslations('Employees.planLocked');
  const user = useSession();
  const [open, setOpen] = useState(false);
  const mayUpgrade = can(user.role, 'settings');
  return (
    <section className="rounded-card border-line bg-surface mx-auto max-w-xl border p-8 text-center shadow-sm">
      <span className="bg-brand-soft text-brand mx-auto flex size-14 items-center justify-center rounded-2xl">
        <IdCard className="size-6" />
      </span>
      <h1 className="text-ink mt-5 text-xl font-extrabold">{t('title')}</h1>
      <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-7">{t('body')}</p>
      <ul className="text-ink-2 mx-auto mt-5 grid max-w-md gap-2 text-start text-sm sm:grid-cols-2">
        {(['employees', 'payroll', 'advances', 'attendance', 'payslips', 'books'] as const).map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className="bg-brand size-1.5 shrink-0 rounded-full" />
            {t(`features.${k}`)}
          </li>
        ))}
      </ul>
      {mayUpgrade ? (
        <Button type="button" onClick={() => setOpen(true)} className={cn(primaryBtn, 'mt-6 h-11 px-6')}>
          <Sparkles className="size-4" />
          {t('upgrade')}
        </Button>
      ) : (
        <p className="text-muted mt-6 text-xs">{t('askOwner')}</p>
      )}
      {mayUpgrade && <UpgradePlanDialog open={open} onClose={() => setOpen(false)} />}
    </section>
  );
}

/** A labelled value in a definition list. */
export function Fact({ label, value, dir }: { label: string; value: React.ReactNode; dir?: 'ltr' | 'auto' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-muted text-xs font-semibold">{label}</dt>
      <dd dir={dir} className="text-ink min-w-0 truncate text-sm font-bold">
        {value ?? '—'}
      </dd>
    </div>
  );
}
