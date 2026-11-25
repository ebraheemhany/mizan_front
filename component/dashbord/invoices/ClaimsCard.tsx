// component/dashbord/invoices/ClaimsCard.tsx
// Receipts the customer sent on the invoice link. Nothing counts until someone who
// records payments looks at the receipt and accepts it (it then becomes a payment,
// with the receipt as its proof) or rejects it (the customer sees why).
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, CircleCheck, CircleX, Eye, Loader2, Receipt, X, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogFooterBar,
  dialogHeaderBar,
  dialogHeading,
  dialogIconTile,
  dialogPopup,
  dialogTitle,
  type DialogTone,
} from '@/component/dialog-chrome';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { openClaimReceipt, useAcceptClaim, useRejectClaim } from '@/lib/collections/hooks';
import { useDate, useDateTime } from '@/lib/data';
import type { PaymentClaim } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

type Account = 'bank' | 'cashbox' | 'wallet';
const DEFAULT_ACCOUNT: Record<PaymentClaim['method'], Account> = { bank: 'bank', instapay: 'bank', vodafoneCash: 'wallet' };

export default function ClaimsCard({ claims, canReview }: { claims: PaymentClaim[]; canReview: boolean }) {
  const t = useTranslations('Claims');
  const errorMessage = useApiErrorMessage();
  const [accepting, setAccepting] = useState<PaymentClaim | null>(null);
  const [rejecting, setRejecting] = useState<PaymentClaim | null>(null);
  const pending = claims.filter((c) => c.status === 'pending');
  const rejected = claims.filter((c) => c.status === 'rejected');

  async function view(id: string) {
    try {
      await openClaimReceipt(id);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <section
      className={cn(
        'rounded-card border p-5 shadow-sm',
        pending.length > 0 ? 'border-amber-300 bg-amber-50/60' : 'border-line bg-surface',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Receipt className="size-4.5" />
        </span>
        <div>
          <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>
          <p className="text-muted text-xs">{pending.length > 0 ? t('pendingHint', { count: pending.length }) : t('noneWaiting')}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {[...pending, ...rejected].map((c) => (
          <ClaimRow
            key={c.id}
            claim={c}
            canReview={canReview}
            onView={() => view(c.id)}
            onAccept={() => setAccepting(c)}
            onReject={() => setRejecting(c)}
          />
        ))}
      </ul>

      <AcceptDialog claim={accepting} onClose={() => setAccepting(null)} />
      <RejectDialog claim={rejecting} onClose={() => setRejecting(null)} />
    </section>
  );
}

function ClaimRow({
  claim,
  canReview,
  onView,
  onAccept,
  onReject,
}: {
  claim: PaymentClaim;
  canReview: boolean;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const t = useTranslations('Claims');
  const tMethods = useTranslations('PublicPay.claim.methods');
  const money = useMoney();
  const date = useDate();
  const dateTime = useDateTime();
  const pending = claim.status === 'pending';

  return (
    <li className={cn('rounded-btn border-line bg-surface border p-4', !pending && 'opacity-80')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink text-lg font-extrabold tabular-nums">{money(claim.amount)}</p>
          <p className="text-muted mt-0.5 text-xs">
            {tMethods(claim.method)} · {date(claim.date)}
            {claim.payerName ? ` · ${claim.payerName}` : ''}
          </p>
          {claim.reference && (
            <p className="text-body mt-1 text-xs">
              {t('reference')}{' '}
              <span dir="auto" className="text-ink font-bold">
                {claim.reference}
              </span>
            </p>
          )}
          {claim.note && <p className="text-body mt-1 text-xs">{claim.note}</p>}
          <p className="text-muted mt-1 text-[11px]">{t('sentAt', { at: dateTime(claim.createdAt) })}</p>
          {!pending && (
            <p className="text-danger mt-1.5 text-xs font-semibold">
              {t('rejected')}
              {claim.rejectReason ? `: ${claim.rejectReason}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onView} className="border-line-strong h-9 gap-1.5 text-xs font-bold">
            <Eye className="size-4" />
            {t('viewReceipt')}
          </Button>
          {pending && canReview && (
            <>
              <Button type="button" variant="outline" onClick={onReject} className="border-line-strong text-danger hover:text-danger h-9 gap-1.5 text-xs font-bold">
                <X className="size-4" />
                {t('reject')}
              </Button>
              <Button type="button" onClick={onAccept} className="bg-brand hover:bg-brand-deep h-9 gap-1.5 text-xs font-bold text-white">
                <Check className="size-4" />
                {t('accept')}
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/** Accepting: which account the money went into (the bank for transfers, the wallet for wallets). */
function AcceptDialog({ claim, onClose }: { claim: PaymentClaim | null; onClose: () => void }) {
  const t = useTranslations('Claims');
  const tAccounts = useTranslations('Claims.accounts');
  const money = useMoney();
  const errorMessage = useApiErrorMessage();
  const accept = useAcceptClaim();
  const [account, setAccount] = useState<Account | null>(null);
  const chosen = account ?? (claim ? DEFAULT_ACCOUNT[claim.method] : 'bank');

  function close() {
    setAccount(null);
    onClose();
  }

  async function confirm() {
    if (!claim) return;
    try {
      await accept.mutateAsync({ id: claim.id, account: chosen });
      toast.success(t('accepted', { amount: money(claim.amount) }));
      close();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <ReviewDialog
      open={claim !== null}
      onClose={close}
      icon={CircleCheck}
      title={t('acceptTitle')}
      description={claim ? t('acceptDescription', { amount: money(claim.amount) }) : ''}
      footer={
        <>
          <Button type="button" variant="outline" onClick={close} className={dialogCancelButton}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={confirm} disabled={accept.isPending} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
            {accept.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {t('acceptConfirm')}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="text-ink mb-2 text-sm font-bold">{t('account')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(['bank', 'wallet', 'cashbox'] as const).map((a) => (
            <label
              key={a}
              className={cn(
                'rounded-btn flex h-11 cursor-pointer items-center justify-center border text-xs font-bold transition-colors',
                chosen === a ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-2 hover:bg-canvas',
              )}
            >
              <input type="radio" name="claim-account" className="sr-only" checked={chosen === a} onChange={() => setAccount(a)} />
              {tAccounts(a)}
            </label>
          ))}
        </div>
      </fieldset>
    </ReviewDialog>
  );
}

/** Rejecting: the reason is required, and the customer sees it on the link. */
function RejectDialog({ claim, onClose }: { claim: PaymentClaim | null; onClose: () => void }) {
  const t = useTranslations('Claims');
  const errorMessage = useApiErrorMessage();
  const reject = useRejectClaim();
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  function close() {
    setReason('');
    setProblem(null);
    onClose();
  }

  async function confirm() {
    if (!claim) return;
    if (reason.trim().length < 2) {
      setProblem(t('reasonRequired'));
      return;
    }
    try {
      await reject.mutateAsync({ id: claim.id, reason: reason.trim() });
      toast.success(t('rejectedToast'));
      close();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <ReviewDialog
      open={claim !== null}
      onClose={close}
      tone="danger"
      icon={CircleX}
      title={t('rejectTitle')}
      description={t('rejectDescription')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={close} className={dialogCancelButton}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={confirm} disabled={reject.isPending} className={cn(dialogConfirmButton, 'bg-danger hover:bg-danger/90')}>
            {reject.isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            {t('rejectConfirm')}
          </Button>
        </>
      }
    >
      <div>
        <Label htmlFor="reject-reason" className="text-ink mb-2 text-sm font-bold">
          {t('reason')}
        </Label>
        <Textarea
          id="reject-reason"
          rows={3}
          maxLength={300}
          placeholder={t('reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-invalid={!!problem}
          className="rounded-btn border-line-strong resize-none"
        />
        {problem && (
          <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
            {problem}
          </p>
        )}
      </div>
    </ReviewDialog>
  );
}

/** The site's dialog layout (dialog-chrome): tinted header with an icon and a close button, the body, the footer bar. */
function ReviewDialog({
  open,
  onClose,
  tone = 'brand',
  icon: Icon,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  tone?: DialogTone;
  icon: LucideIcon;
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations('Claims');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
        <div className={dialogHeaderBar(tone)}>
          <span className={dialogIconTile(tone)}>
            <Icon className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{title}</DialogTitle>
            <DialogDescription className={dialogDescription}>{description}</DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className={dialogClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <DialogFooter className={dialogFooterBar}>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
