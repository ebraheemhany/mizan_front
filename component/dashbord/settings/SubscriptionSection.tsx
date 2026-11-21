// component/dashbord/settings/SubscriptionSection.tsx
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle, CreditCard, FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useBilling, useCheckout, useSubscriptionChange, type Billing } from '@/lib/billing/hooks';
import { cn } from '@/lib/utils';
import { BillingHistorySheet } from './BillingHistorySheet';
import { UpgradePlanDialog } from './UpgradePlanDialog';

function Meter({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = Math.min(100, Math.round((used / Math.max(total, 1)) * 100));
  return (
    <div
      className="bg-neutral-soft mt-1 h-2 overflow-hidden rounded-full"
      role="progressbar"
      aria-label={label}
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-danger' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SubscriptionSection() {
  const t = useTranslations('Settings.subscription');
  const user = useSession();
  const billing = useBilling();

  return (
    <section id="subscription" className="rounded-card border-line bg-surface scroll-mt-24 border p-6 shadow-sm">
      <h2 className="text-ink mb-2 text-base font-extrabold">{t('title')}</h2>
      {billing.isPending ? (
        <div className="text-muted flex justify-center py-10">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : billing.isError ? (
        <div className="py-8 text-center">
          <p className="text-danger text-sm font-semibold">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={() => billing.refetch()} className="border-line-strong mt-3 h-9 text-xs font-bold">
            {t('retry')}
          </Button>
        </div>
      ) : (
        <SubscriptionDetails billing={billing.data} isOwner={can(user.role, 'settings')} />
      )}
    </section>
  );
}

function SubscriptionDetails({ billing, isOwner }: { billing: Billing; isOwner: boolean }) {
  const t = useTranslations('Settings.subscription');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const checkout = useCheckout();
  const change = useSubscriptionChange();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const num = (n: number) => format.number(n, { numberingSystem: 'latn' });
  const day = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn', timeZone: 'UTC' });

  const sub = billing.subscription;
  const planName = (id: string) => t(`plans.${id}`);
  const { usage } = billing;
  const row = 'flex items-center justify-between gap-4 py-3.5';

  function payNow() {
    if (!sub) return;
    const plan = sub.nextPlan ?? billing.plan;
    if (plan === 'free') return;
    checkout.mutate(plan, { onError: (error) => toast.error(errorMessage(error)) });
  }

  function cancel() {
    setCancelOpen(false);
    change.mutate(
      { kind: 'cancel' },
      {
        onSuccess: (next) =>
          toast.success(
            next.subscription ? t('toasts.cancelled', { date: day(next.subscription.periodEnd) }) : t('toasts.ended'),
          ),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  function resume() {
    change.mutate(
      { kind: 'resume' },
      {
        onSuccess: () => toast.success(t('toasts.resumed')),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  return (
    <>
      {sub?.status === 'pastDue' && (
        <div role="alert" className="rounded-btn mb-3 flex gap-2.5 border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{t('pastDue.title')}</p>
            <p>{t('pastDue.body', { date: day(sub.graceEndsOn ?? sub.periodEnd) })}</p>
            {isOwner && (
              <Button
                type="button"
                onClick={payNow}
                disabled={checkout.isPending}
                className="bg-brand hover:bg-brand-deep mt-2 h-8 text-xs font-bold text-white"
              >
                {checkout.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {t('pastDue.pay')}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="divide-line divide-y">
        <div className={row}>
          <span className="text-muted text-sm">{t('currentPlan')}</span>
          <span className="text-ink text-sm font-bold">{planName(billing.plan)}</span>
        </div>

        {sub && (
          <div className={row}>
            <span className="text-muted text-sm">
              {sub.cancelAtPeriodEnd ? t('endsOn') : sub.nextPlan ? t('changesOn') : t('nextRenewal')}
            </span>
            <span className="text-ink text-end text-sm font-bold">
              {day(sub.periodEnd)}
              {sub.cancelAtPeriodEnd && <span className="text-muted block text-[11px] font-semibold">{t('backToFree')}</span>}
              {sub.nextPlan && !sub.cancelAtPeriodEnd && (
                <span className="text-muted block text-[11px] font-semibold">{t('switchesTo', { plan: planName(sub.nextPlan) })}</span>
              )}
            </span>
          </div>
        )}

        {sub && (
          <div className={row}>
            <span className="text-muted text-sm">{t('card')}</span>
            {sub.card ? (
              <span className="text-ink flex items-center gap-1.5 text-sm font-bold" dir="ltr">
                <CreditCard className="text-muted size-4" aria-hidden="true" />
                {sub.card.brand} •••• {sub.card.masked.slice(-4)}
              </span>
            ) : (
              <span className="text-muted max-w-[60%] text-end text-xs">{t('noCard')}</span>
            )}
          </div>
        )}

        <div className="py-3.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted text-sm">{t('users')}</span>
            <span className="text-ink text-sm font-bold">
              {t('usersOf', { used: num(usage.users), total: num(usage.usersLimit) })}
            </span>
          </div>
          <Meter used={usage.users} total={usage.usersLimit} label={t('users')} />
        </div>

        {usage.invoicesLimit !== null && (
          <div className="py-3.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted text-sm">{t('invoicesThisMonth')}</span>
              <span className="text-ink text-sm font-bold">
                {t('usersOf', { used: num(usage.invoicesThisMonth), total: num(usage.invoicesLimit) })}
              </span>
            </div>
            <Meter used={usage.invoicesThisMonth} total={usage.invoicesLimit} label={t('invoicesThisMonth')} />
          </div>
        )}
      </div>

      {billing.testMode && isOwner && (
        <p className="text-muted mt-3 flex items-start gap-1.5 text-[11px] leading-5">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t('testMode')}
        </p>
      )}

      {isOwner ? (
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setHistoryOpen(true)} className="border-line-strong h-10 text-xs font-bold">
            {t('billingHistory')}
          </Button>
          {sub && (sub.cancelAtPeriodEnd || sub.nextPlan) ? (
            <Button type="button" variant="outline" onClick={resume} disabled={change.isPending} className="border-line-strong h-10 text-xs font-bold">
              {t('resume')}
            </Button>
          ) : (
            sub?.status === 'active' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                disabled={change.isPending}
                className="text-danger hover:bg-danger-soft hover:text-danger h-10 text-xs font-bold"
              >
                {t('cancel')}
              </Button>
            )
          )}
          <Button type="button" onClick={() => setUpgradeOpen(true)} className="bg-brand hover:bg-brand-deep h-10 text-xs font-bold text-white">
            {sub ? t('changePlan') : t('upgrade')}
          </Button>
        </div>
      ) : (
        <p className="text-muted mt-4 text-xs">{t('ownerOnly')}</p>
      )}

      {isOwner && <BillingHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />}
      <UpgradePlanDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ConfirmDialog
        open={cancelOpen}
        title={t('cancelDialog.title')}
        description={sub ? t('cancelDialog.description', { date: day(sub.periodEnd) }) : ''}
        cancelLabel={t('cancelDialog.keep')}
        confirmLabel={t('cancelDialog.confirm')}
        onConfirm={cancel}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
