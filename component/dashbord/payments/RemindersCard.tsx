// component/dashbord/payments/RemindersCard.tsx
'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useMoney } from '@/lib/money';
import {
  customerPhones,
  PAYMENTS_TODAY,
  type OpenInvoice,
} from '@/lib/mock/payments';
import { overdueInvoices } from './utils';

export default function RemindersCard({
  invoices,
}: {
  invoices: OpenInvoice[];
}) {
  const t = useTranslations('Payments.reminders');
  const format = useFormatter();
  const money = useMoney();

  const list = useMemo(
    () => overdueInvoices(invoices, PAYMENTS_TODAY),
    [invoices],
  );

  const num = (v: number) =>
    format.number(v, { useGrouping: false, numberingSystem: 'latn' });

  function sendWhatsApp(inv: OpenInvoice, daysLate: number) {
    const phone = customerPhones[inv.customer];
    if (!phone) {
      toast.error(t('noPhone', { customer: inv.customer }));
      return;
    }

    const text = t('message', {
      customer: inv.customer,
      number: num(inv.number),
      amount: money(inv.balance),
      days: num(daysLate),
    });

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      {list.length === 0 ? (
        <p className="text-muted py-6 text-center text-xs">{t('empty')}</p>
      ) : (
        <ul className="mt-3">
          {list.map(({ invoice, daysLate }) => (
            <li
              key={invoice.number}
              className="border-line/70 flex items-center justify-between gap-3 border-b py-3.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-ink text-xs font-bold">
                  #{num(invoice.number)} — {invoice.customer}
                </p>
                <p className="text-danger mt-0.5 text-[11px] font-semibold">
                  {t('late', { count: daysLate, text: num(daysLate) })}
                  {' · '}
                  {money(invoice.balance)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => sendWhatsApp(invoice, daysLate)}
                className="rounded-btn border-line-strong text-brand-deep h-9 shrink-0 gap-1.5 border text-xs font-bold"
              >
                <MessageCircle className="size-4" />
                {t('whatsapp')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
