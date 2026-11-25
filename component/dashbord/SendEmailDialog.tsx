// component/dashbord/SendEmailDialog.tsx
// Emailing a document (invoice, quote) to the customer: the address, and an
// optional message in place of the standard greeting.
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Mail, MailWarning, X } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

const MAX = 2000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SendEmailInput = { to: string; message: string };

function SendEmailForm({
  defaultTo,
  hint,
  onSend,
  onCancel,
}: {
  defaultTo: string;
  hint: string;
  /** Resolves to true when it was sent (the dialog then closes). */
  onSend: (input: SendEmailInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const t = useTranslations('SendEmail');
  const user = useSession();
  const [to, setTo] = useState(defaultTo);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<'toRequired' | 'toInvalid' | 'max' | null>(null);
  const [sending, setSending] = useState(false);
  // Replies go to the sender, so only a confirmed address may send (the server checks too).
  const unverified = !user.emailVerifiedAt;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = to.trim();
    if (!address) return setError('toRequired');
    if (!EMAIL.test(address)) return setError('toInvalid');
    if (message.length > MAX) return setError('max');
    setSending(true);
    const sent = await onSend({ to: address, message: message.trim() });
    setSending(false);
    if (sent) onCancel();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5 px-6 py-5">
        {unverified && (
          <p role="alert" className="rounded-btn flex gap-2 border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
            <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t('unverified', { email: user.email })}
          </p>
        )}

        <div>
          <Label htmlFor="send-email-to" className="text-ink mb-2 text-sm font-bold">
            {t('to')}
          </Label>
          <Input
            id="send-email-to"
            type="email"
            dir="ltr"
            autoComplete="off"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setError(null);
            }}
            aria-invalid={error === 'toRequired' || error === 'toInvalid'}
            className="rounded-btn border-line-strong h-11"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="send-email-message" className="text-ink text-sm font-bold">
              {t('message')} <span className="text-muted text-xs font-semibold">({t('optional')})</span>
            </Label>
            <span className="text-muted text-xs tabular-nums">
              {message.length}/{MAX}
            </span>
          </div>
          <Textarea
            id="send-email-message"
            rows={5}
            dir={message ? 'auto' : undefined}
            value={message}
            placeholder={t('messagePlaceholder')}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            aria-invalid={error === 'max'}
            className="rounded-btn border-line-strong bg-surface resize-none leading-7"
          />
          <p className="text-muted mt-1.5 text-xs leading-5">{hint}</p>
        </div>

        {error && (
          <p role="alert" className="text-danger text-xs font-semibold">
            {t(`errors.${error}`)}
          </p>
        )}
      </div>

      <DialogFooter className={dialogFooterBar}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className={dialogCancelButton}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={sending || unverified}
          className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function SendEmailDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultTo,
  hint,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultTo: string;
  /** What the customer will get. */
  hint: string;
  onSend: (input: SendEmailInput) => Promise<boolean>;
}) {
  const t = useTranslations('SendEmail');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(dialogPopup, 'sm:max-w-lg')}
      >
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <Mail className="size-5" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{title}</DialogTitle>
            <DialogDescription className="text-muted truncate text-xs">{description}</DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className={dialogClose}
          >
            <X className="size-4" />
          </button>
        </div>
        {/* Mounted only while open, so each opening starts from the customer's address. */}
        {open && <SendEmailForm defaultTo={defaultTo} hint={hint} onSend={onSend} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
