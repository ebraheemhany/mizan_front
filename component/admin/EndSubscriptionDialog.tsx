// component/admin/EndSubscriptionDialog.tsx
// Mizan's staff end a company's paid plan: at the end of what is paid (no renewal, as the
// owner's own cancellation does), or now (back to free at once, e.g. a plan activated by
// mistake). A renewal that wasn't paid, or a plan already set to end, can only end now.
'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CircleOff, Loader2, X } from 'lucide-react';
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
import { useEndSubscription, type AdminCompanyDetail } from '@/lib/admin/hooks';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { cn } from '@/lib/utils';
import { useShortDate } from './admin-ui';

type When = 'now' | 'periodEnd';

export default function EndSubscriptionDialog({
  company,
  open,
  onOpenChange,
}: {
  company: AdminCompanyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('Admin.end');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-lg')}>
        <div className={dialogHeaderBar('danger')}>
          <span className={dialogIconTile('danger')}>
            <CircleOff className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t('title')}</DialogTitle>
            <DialogDescription className="text-muted truncate text-xs">{company.company.name}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </div>
        {open && <EndForm company={company} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EndForm({ company, onDone }: { company: AdminCompanyDetail; onDone: () => void }) {
  const t = useTranslations('Admin.end');
  const tPlans = useTranslations('Admin.plans');
  const date = useShortDate();
  const errorMessage = useApiErrorMessage();
  const endPlan = useEndSubscription(company.company.id);
  const sub = company.subscription;
  // Paid days are left only on an active plan that isn't already set to end.
  const canWait = sub !== null && sub.status === 'active' && !sub.cancelAtPeriodEnd;
  const [when, setWhen] = useState<When>(canWait ? 'periodEnd' : 'now');
  const [error, setError] = useState<string | null>(null);
  const plan = tPlans(sub?.plan ?? 'free');
  const periodEnd = sub ? date(sub.currentPeriodEnd) : '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await endPlan.mutateAsync(when);
      toast.success(when === 'now' || !canWait ? t('endedNow', { plan }) : t('endsLater', { plan, date: periodEnd }));
      onDone();
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'NO_SUBSCRIPTION' ? t('alreadyFree') : errorMessage(err));
    }
  }

  const options: { value: When; title: string; text: string }[] = [
    ...(canWait ? [{ value: 'periodEnd' as const, title: t('periodEnd', { date: periodEnd }), text: t('periodEndText', { plan, date: periodEnd }) }] : []),
    { value: 'now', title: t('now'), text: t('nowText', { plan }) },
  ];

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-3 px-6 py-5">
        <div role="radiogroup" aria-label={t('when')} className="space-y-2.5">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={when === o.value}
              onClick={() => setWhen(o.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-start transition-colors focus-visible:ring-4 focus-visible:ring-danger/15 focus-visible:outline-none',
                when === o.value ? 'border-danger/50 bg-danger-soft/50 ring-danger/10 ring-2' : 'border-line-strong bg-surface hover:bg-canvas',
              )}
            >
              <span className="text-ink block text-sm font-extrabold">{o.title}</span>
              <span className="text-body mt-0.5 block text-xs leading-5">{o.text}</span>
            </button>
          ))}
        </div>
        {!canWait && sub && <p className="text-muted text-xs leading-5">{sub.status === 'pastDue' ? t('pastDueOnlyNow') : t('alreadyEnding', { date: periodEnd })}</p>}
        <p className="text-muted text-xs leading-5">{t('payments')}</p>

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
        <Button type="submit" disabled={endPlan.isPending} className={cn(dialogConfirmButton, 'bg-danger hover:bg-danger/90')}>
          {endPlan.isPending ? <Loader2 className="size-4 animate-spin" /> : <CircleOff className="size-4" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}
