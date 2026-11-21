// components/invoices/HistoryTimeline.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useDateTime } from '@/lib/data';
import type { HistoryEvent } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';

export default function HistoryTimeline({
  events,
}: {
  events: HistoryEvent[];
}) {
  const t = useTranslations('InvoiceDetail.history');
  const tChannels = useTranslations('InvoiceDetail.reminderDialog.channels');
  const dateTime = useDateTime();
  const money = useMoney();

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      <ol className="mt-4">
        {events.map((e, i) => {
          const values =
            e.type === 'payment' || e.type === 'paymentRemoved' || e.type === 'chequeBounced'
              ? { ...e.values, amount: money(Number(e.values?.amount ?? 0)) }
              : e.type === 'reminderSent'
                ? { channel: tChannels(String(e.values?.channel ?? 'email')) }
                : e.values;
          const hasDetail = t.has(`events.${e.type}.detail`);

          return (
            <li key={e.id} className="relative ps-6 pb-5 last:pb-0">
              {i < events.length - 1 && (
                <span
                  aria-hidden
                  className="bg-line-strong absolute start-[4.5px] top-4 bottom-0 w-px"
                />
              )}
              <span
                aria-hidden
                className="bg-brand ring-surface absolute start-0 top-1.5 size-2.5 rounded-full ring-4"
              />

              <p className="text-ink text-sm leading-6">
                <span className="font-bold">
                  {t(`events.${e.type}.title`, values)}
                </span>
                {hasDetail && (
                  <span className="text-body">
                    {' '}
                    {t(`events.${e.type}.detail`, values)}
                  </span>
                )}
              </p>
              <p className="text-muted mt-0.5 text-xs">{dateTime(e.at)}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
