// component/dashbord/settings/UpgradePlanDialog.tsx
// The plans side by side: pay for a higher one (Paymob), or move to a lower one
// at the end of the period.
'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { thinScrollbar } from '@/component/dialog-chrome';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  isHigherPlan,
  PLAN_CURRENCY,
  PLAN_FEATURES,
  useBilling,
  useCheckout,
  useSubscriptionChange,
  type Plan,
  type PlanId,
} from '@/lib/billing/hooks';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

type Props = { open: boolean; onClose: () => void };

export function UpgradePlanDialog({ open, onClose }: Props) {
  const t = useTranslations('Settings.subscription');
  const format = useFormatter();
  const money = useMoney();
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const billing = useBilling();
  const checkout = useCheckout();
  const change = useSubscriptionChange();
  // The plan whose button was pressed (its spinner).
  const [busy, setBusy] = useState<PlanId | null>(null);

  const isOwner = can(user.role, 'settings');
  const data = billing.data;
  const current = data?.plan ?? 'free';
  const sub = data?.subscription ?? null;
  const num = (n: number) => format.number(n, { numberingSystem: 'latn' });
  const day = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn', timeZone: 'UTC' });
  const name = (id: PlanId) => t(`plans.${id}`);

  /** What choosing this plan does now, and the button's words. */
  function actionFor(plan: Plan): { label: string; run?: () => void; note?: string } {
    if (plan.id === current && sub?.status !== 'pastDue') return { label: t('upgradeDialog.currentPlan') };
    // A higher plan, or paying a renewal that wasn't charged: Paymob's page.
    if (plan.id !== 'free' && (isHigherPlan(plan.id, current) || sub?.status === 'pastDue')) {
      const paid = plan.id;
      return {
        label: sub?.status === 'pastDue' ? t('upgradeDialog.payFor', { plan: name(paid) }) : t('upgradeDialog.upgradeTo', { plan: name(paid) }),
        note: sub?.status === 'active' ? t('upgradeDialog.prorated') : undefined,
        run: () => {
          setBusy(paid);
          checkout.mutate(paid, {
            onError: (error) => {
              setBusy(null);
              toast.error(errorMessage(error));
            },
          });
        },
      };
    }
    if (!sub) return { label: t('upgradeDialog.lowerPlan') };
    // Lower: from the end of the period (free = cancel).
    if (plan.id === 'free') {
      if (sub.cancelAtPeriodEnd) return { label: t('upgradeDialog.scheduled', { date: day(sub.periodEnd) }) };
      return {
        label: t('upgradeDialog.backToFreeOn', { date: day(sub.periodEnd) }),
        run: () =>
          change.mutate(
            { kind: 'cancel' },
            {
              onSuccess: () => {
                toast.success(t('toasts.cancelled', { date: day(sub.periodEnd) }));
                onClose();
              },
              onError: (error) => toast.error(errorMessage(error)),
            },
          ),
      };
    }
    if (sub.nextPlan === plan.id) return { label: t('upgradeDialog.scheduled', { date: day(sub.periodEnd) }) };
    return {
      label: t('upgradeDialog.downgradeOn', { plan: name(plan.id), date: day(sub.periodEnd) }),
      run: () =>
        change.mutate(
          { kind: 'downgrade', plan: 'pro' },
          {
            onSuccess: () => {
              toast.success(t('toasts.downgraded', { plan: name(plan.id), date: day(sub.periodEnd) }));
              onClose();
            },
            onError: (error) => toast.error(errorMessage(error)),
          },
        ),
    };
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'border-line bg-[#f7fbf9] rounded-[28px] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] gap-6 overflow-x-hidden overflow-y-auto border p-5 shadow-[0_24px_70px_rgba(10,70,50,0.18)] sm:max-w-5xl sm:p-8',
          thinScrollbar,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('upgradeDialog.close')}
          className="text-muted hover:bg-white/70 hover:text-ink focus-visible:ring-brand/30 absolute end-4 top-4 rounded-full p-2 transition-colors outline-none focus-visible:ring-2"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <DialogHeader className="pe-10 text-start">
          <span className="bg-[#e8f7f1] text-[#00704a] flex size-11 items-center justify-center rounded-2xl">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-[#0b251d] text-xl font-black">{t('upgradeDialog.title')}</DialogTitle>
          <DialogDescription className="text-muted text-sm leading-6">
            {isOwner ? t('upgradeDialog.description') : t('ownerOnly')}
          </DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="text-muted flex justify-center py-16">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {data.plans.map((plan) => {
              const isCurrent = plan.id === current;
              const isFeatured = plan.id === 'pro';
              const action = actionFor(plan);
              const enabled = isOwner && Boolean(action.run) && !checkout.isPending && !change.isPending;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'flex flex-col rounded-[24px] border p-5 shadow-[0_12px_30px_rgba(35,55,45,0.06)] sm:p-6',
                    isFeatured
                      ? 'border-[#0a7b5a] bg-[#0a7b5a] text-white shadow-[0_20px_50px_rgba(10,123,90,0.18)]'
                      : 'border-[#dfe9e5] bg-white text-[#0b251d]',
                  )}
                >
                  <div className="mb-5 flex min-h-8 items-center justify-between gap-2">
                    <h3 className={cn('text-lg font-extrabold', isFeatured ? 'text-white' : 'text-[#0b251d]')}>{name(plan.id)}</h3>
                    {(isCurrent || isFeatured) && (
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[10px] font-bold',
                          isFeatured ? 'border border-white/30 bg-white/10 text-white' : 'bg-[#e8f7f1] text-[#00704a]',
                        )}
                      >
                        {isCurrent ? t('upgradeDialog.currentBadge') : t('upgradeDialog.popular')}
                      </span>
                    )}
                  </div>

                  <p className={cn('text-3xl font-black', isFeatured ? 'text-white' : 'text-[#0b251d]')}>
                    {plan.price === 0 ? t('upgradeDialog.free') : money(plan.price, PLAN_CURRENCY)}
                    {plan.price > 0 && (
                      <span className={cn('ms-1 text-xs font-semibold', isFeatured ? 'text-emerald-100' : 'text-muted')}>
                        {t('upgradeDialog.perMonth')}
                      </span>
                    )}
                  </p>

                  <ul className={cn('mt-5 flex-1 space-y-3 border-t pt-5', isFeatured ? 'border-white/20' : 'border-[#e8f1ed]')}>
                    {PLAN_FEATURES[plan.id].map((key) => (
                      <li key={key} className={cn('flex items-start gap-2 text-sm', isFeatured ? 'text-emerald-50' : 'text-gray-700')}>
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                            isFeatured ? 'bg-white/15 text-white' : 'bg-[#e8f7f1] text-[#00704a]',
                          )}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </span>
                        <span>{t(`upgradeDialog.features.${key}`, {
                            count: plan.users,
                            n: num(plan.users),
                            invoices: num(plan.invoicesPerMonth ?? 0),
                          })}</span>
                      </li>
                    ))}
                  </ul>

                  {action.note && (
                    <p className={cn('mt-4 text-[11px] leading-5', isFeatured ? 'text-emerald-100' : 'text-muted')}>{action.note}</p>
                  )}
                  <Button
                    type="button"
                    disabled={!enabled}
                    onClick={action.run}
                    variant={action.run ? 'default' : 'outline'}
                    className={cn(
                      'mt-4 h-11 rounded-xl text-xs font-bold',
                      isFeatured && 'border-white bg-white text-[#0a7b5a] hover:bg-emerald-50',
                      !isFeatured && action.run && 'bg-[#0a7b5a] text-white hover:bg-[#005739]',
                      !isFeatured && !action.run && 'border-[#dfe9e5] bg-[#f6f9f7] text-[#0b251d]',
                    )}
                  >
                    {busy === plan.id && checkout.isPending && <Loader2 className="size-4 animate-spin" />}
                    {action.label}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
