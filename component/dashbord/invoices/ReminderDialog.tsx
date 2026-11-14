// components/invoices/ReminderDialog.tsx
'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Send, X, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDate } from '@/lib/data';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

export type ReminderChannel = 'email' | 'whatsapp';
export type ReminderInput = {
  channel: ReminderChannel;
  message: string;
  recipient: string;
};

const CHANNELS: { key: ReminderChannel; icon: LucideIcon }[] = [
  { key: 'email', icon: Mail },
  { key: 'whatsapp', icon: MessageCircle },
];

const MAX = 600;

function ReminderForm({
  invoice,
  onSend,
  onCancel,
}: {
  invoice: InvoiceDetail;
  onSend: (input: ReminderInput) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('InvoiceDetail.reminderDialog');
  const money = useMoney();
  const date = useDate();

  const [channel, setChannel] = useState<ReminderChannel>('email');
  const [message, setMessage] = useState(() =>
    t(invoice.status === 'overdue' ? 'templateOverdue' : 'template', {
      customer: invoice.customer,
      number: String(invoice.number),
      amount: money(invoice.remaining),
      dueDate: date(invoice.dueDate),
    }),
  );
  const [error, setError] = useState<'required' | 'max' | null>(null);

  const recipients: Record<ReminderChannel, string> = {
    email: invoice.client.email ?? '',
    whatsapp: invoice.client.phone ?? '',
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();

    if (!text) {
      setError('required');
      return;
    }
    if (text.length > MAX) {
      setError('max');
      return;
    }
    onSend({ channel, message: text, recipient: recipients[channel] });
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5 px-6 py-5">
        {/* القناة */}
        <div>
          <p id="channel-label" className="text-ink mb-2 text-sm font-bold">
            {t('channel')}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="channel-label"
            className="grid gap-2.5 sm:grid-cols-2"
          >
            {CHANNELS.map(({ key, icon: Icon }) => {
              const selected = channel === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChannel(key)}
                  className={cn(
                    'rounded-btn focus-visible:ring-brand/30 flex items-center gap-3 border p-3 text-start transition-colors outline-none focus-visible:ring-2',
                    selected
                      ? 'border-brand bg-brand-soft text-brand-deep'
                      : 'border-line-strong bg-surface text-ink-2 hover:bg-canvas',
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      {t(`channels.${key}`)}
                    </span>
                    <span
                      dir="ltr"
                      className="text-muted block truncate text-start text-xs"
                    >
                      {recipients[key]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* الرسالة */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="message" className="text-ink text-sm font-bold">
              {t('message')}
            </Label>
            <span className="text-muted text-xs tabular-nums">
              {message.length}/{MAX}
            </span>
          </div>
          <Textarea
            id="message"
            rows={7}
            dir="auto"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            className="rounded-btn border-line-strong bg-surface resize-none leading-7"
          />
          {error && (
            <p
              role="alert"
              className="text-danger mt-1.5 text-xs font-semibold"
            >
              {t(`errors.${error}`)}
            </p>
          )}
        </div>
      </div>

      <DialogFooter className="border-line bg-canvas gap-2 border-t px-6 py-4 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-btn border-line-strong bg-surface h-11 px-6 font-bold"
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          className="rounded-btn bg-brand hover:bg-brand/90 h-11 px-8 font-bold text-white"
        >
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ReminderDialog({
  open,
  onOpenChange,
  invoice,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDetail;
  onSend: (input: ReminderInput) => void;
}) {
  const t = useTranslations('InvoiceDetail.reminderDialog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-card border-line bg-surface text-ink shadow-float max-h-[90dvh] gap-0 overflow-x-hidden overflow-y-auto border p-0 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand sm:max-w-lg"
      >
        <div className="border-line bg-brand-soft/60 relative flex items-center gap-3.5 border-b px-6 py-5">
          <span className="bg-surface text-brand ring-brand/10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
            <Send className="size-5" />
          </span>

          <DialogHeader className="min-w-0 gap-0.5 pe-8 text-start">
            <DialogTitle className="text-ink text-lg font-extrabold">
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-muted truncate text-xs">
              {t('description', {
                number: String(invoice.number),
                customer: invoice.customer,
              })}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className="text-muted hover:bg-surface hover:text-ink absolute end-4 top-4 rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <ReminderForm
          invoice={invoice}
          onSend={onSend}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
