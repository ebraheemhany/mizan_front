// component/admin/ActivateSubscriptionDialog.tsx
// Mizan's staff activate or extend a company's plan that was paid outside Paymob (cash,
// a transfer). Same rules as the backend: the same running plan is extended from the end
// of its paid period; another plan (or a company on the free plan) starts today.
'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogFooterBar,
  dialogHeaderBar,
  dialogHeading,
  dialogIconTile,
  dialogPopup,
  dialogTitle,
} from '@/component/dialog-chrome';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActivateSubscription, type ActivateSubscriptionInput, type AdminCompanyDetail } from '@/lib/admin/hooks';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { PLAN_CURRENCY, useBilling } from '@/lib/billing/hooks';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useShortDate } from './admin-ui';

type PaidPlan = ActivateSubscriptionInput['plan'];
const PAID_PLANS: PaidPlan[] = ['pro', 'business'];
const MONTHS = [1, 3, 6, 12];
/** If the plans can't be loaded (prices as on the landing page). */
const FALLBACK_PRICES: Record<PaidPlan, number> = { pro: 299, business: 799 };

/** Today in Cairo, as yyyy-mm-dd (subscription dates are Cairo dates). */
function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
}

/** The backend's addMonths: the same day, or the month's last day when it's shorter. */
function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

export default function ActivateSubscriptionDialog({
  company,
  open,
  onOpenChange,
}: {
  company: AdminCompanyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('Admin.activate');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-lg')}>
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <BadgeCheck className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t('title')}</DialogTitle>
            <DialogDescription className="text-muted truncate text-xs">{company.company.name}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        {/* Mounted only while open, so each opening starts from the company's current plan. */}
        {open && <ActivateForm company={company} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ActivateForm({ company, onDone }: { company: AdminCompanyDetail; onDone: () => void }) {
  const t = useTranslations('Admin.activate');
  const tPlans = useTranslations('Admin.plans');
  const money = useMoney();
  const date = useShortDate();
  const errorMessage = useApiErrorMessage();
  const activate = useActivateSubscription(company.company.id);
  const plans = useBilling().data?.plans;
  const priceOf = (plan: PaidPlan) => plans?.find((p) => p.id === plan)?.price ?? FALLBACK_PRICES[plan];

  const sub = company.subscription;
  const running = sub !== null && sub.status !== 'ended';
  const [plan, setPlan] = useState<PaidPlan>(running ? sub.plan === 'business' ? 'business' : 'pro' : 'pro');
  const [months, setMonths] = useState(1);
  // The amount follows the plan and the months until it is typed in by hand.
  const [typedAmount, setTypedAmount] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amount = typedAmount ?? String(priceOf(plan) * months);
  const extend = running && sub.plan === plan;
  const start = extend ? sub.currentPeriodEnd : cairoToday();
  const end = addMonths(start, months);
  const amountValid = /^\d{1,9}(\.\d{1,2})?$/.test(amount.trim());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!amountValid) {
      setError(t('amountInvalid'));
      return;
    }
    setError(null);
    try {
      await activate.mutateAsync({ plan, months, amount: amount.trim(), note: note.trim() || undefined });
      toast.success(t('done', { plan: tPlans(plan), date: date(end) }));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const choice = (selected: boolean) =>
    cn(
      'rounded-xl border px-3 py-2.5 text-start transition-colors focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:outline-none',
      selected ? 'border-brand bg-brand-soft/60 ring-brand/10 ring-2' : 'border-line-strong bg-surface hover:bg-canvas',
    );

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5 px-6 py-5">
        <fieldset>
          <legend className="text-ink mb-2 text-sm font-bold">{t('plan')}</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {PAID_PLANS.map((p) => (
              <button key={p} type="button" aria-pressed={plan === p} onClick={() => setPlan(p)} className={choice(plan === p)}>
                <span className="text-ink block text-sm font-extrabold">{tPlans(p)}</span>
                <span className="text-muted block text-xs">{t('perMonth', { price: money(priceOf(p), PLAN_CURRENCY) })}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-ink mb-2 text-sm font-bold">{t('months')}</legend>
          <div className="flex gap-2">
            {MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={months === m}
                onClick={() => setMonths(m)}
                className={cn(choice(months === m), 'min-w-0 flex-1 px-2 text-center text-sm font-bold whitespace-nowrap')}
              >
                {t('monthCount', { count: m })}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="activate-amount" className="text-ink mb-2 text-sm font-bold">
              {t('amount')}
            </Label>
            <div className="relative">
              <Input
                id="activate-amount"
                inputMode="decimal"
                dir="ltr"
                value={amount}
                onChange={(e) => setTypedAmount(e.target.value)}
                aria-invalid={!amountValid}
                className="rounded-btn border-line-strong h-11 pr-14 text-start tabular-nums"
              />
              {/* The field reads left to right, so the currency sits on its right. */}
              <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold">{PLAN_CURRENCY}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="activate-note" className="text-ink mb-2 text-sm font-bold">
              {t('note')} <span className="text-muted text-xs font-semibold">({t('optional')})</span>
            </Label>
            <Input
              id="activate-note"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              className="rounded-btn border-line-strong h-11"
            />
          </div>
        </div>

        <div className="bg-brand-soft/60 border-brand/15 text-body space-y-1 rounded-2xl border p-3.5 text-sm leading-6">
          <p className="text-ink font-bold">
            {extend
              ? t('summaryExtend', { plan: tPlans(plan), date: date(end) })
              : t('summaryStart', { plan: tPlans(plan), start: date(start), date: date(end) })}
          </p>
          {running && !extend && <p className="text-xs">{t('replaces', { plan: tPlans(sub.plan) })}</p>}
          {running && sub.card && <p className="text-xs">{t('cardStays')}</p>}
          <p className="text-muted text-xs">{t('recorded')}</p>
        </div>

        {error && (
          <p role="alert" className="bg-danger-soft text-danger rounded-btn px-3 py-2.5 text-sm font-semibold">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className={dialogFooterBar}>
        <Button type="button" variant="outline" onClick={onDone} className={dialogCancelButton}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={activate.isPending} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
          {activate.isPending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}
