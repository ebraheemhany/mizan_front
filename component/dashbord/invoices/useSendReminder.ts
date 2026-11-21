// components/invoices/useSendReminder.ts
// Sending a payment reminder, from the invoice page or the list. By email the
// server sends it; by WhatsApp the chat opens here with the message ready, and
// the server records it.
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useInvoiceAction } from '@/lib/invoices/hooks';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { openWhatsApp, toWhatsAppNumber } from '@/lib/whatsapp';
import type { ReminderInput } from './ReminderDialog';

export function useSendReminder() {
  const t = useTranslations('InvoiceDetail');
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const action = useInvoiceAction();
  const mailLocale: 'ar' | 'en' = locale === 'en' ? 'en' : 'ar';

  /** Resolves to true once sent (the dialog can close). */
  return async function sendReminder(invoice: InvoiceDetail, input: ReminderInput) {
    if (input.channel === 'whatsapp') {
      const number = toWhatsAppNumber(input.recipient);
      if (!number) {
        toast.error(t('toasts.noPhone', { customer: invoice.customer }));
        return false;
      }
      // Before any await: browsers only allow the new tab straight from the click.
      openWhatsApp(number, input.message);
    }
    try {
      await action.mutateAsync({
        kind: 'reminder',
        ref: invoice.id,
        body:
          input.channel === 'email'
            ? { channel: 'email', to: input.recipient || undefined, message: input.message, locale: mailLocale }
            : { channel: 'whatsapp', recipient: input.recipient, message: input.message, locale: mailLocale },
      });
      toast.success(
        input.channel === 'email'
          ? t('toasts.reminderEmailed', { recipient: input.recipient || invoice.customer })
          : t('toasts.reminderSent', { recipient: input.recipient }),
      );
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  };
}
