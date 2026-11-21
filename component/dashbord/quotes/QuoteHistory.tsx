// components/quotes/QuoteHistory.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDateTime } from '@/lib/data';
import type { QuoteEvent } from '@/lib/quotes/hooks';

/** The quote's history from the API, newest first. */
export default function QuoteHistory({ events, customer }: { events: QuoteEvent[]; customer: string }) {
  const t = useTranslations('QuoteDetail.history');
  const dateTime = useDateTime();

  function text(e: QuoteEvent) {
    switch (e.type) {
      case 'created':
        return t('created');
      case 'sent':
        return t('sent', { customer });
      case 'emailed':
        return t('emailed', { to: String(e.values.to ?? '') });
      // From the customer's link, or recorded by someone in the company.
      case 'accepted':
        return e.values.by === 'customer' ? t('accepted') : t('acceptedByUser');
      case 'rejected':
        return e.values.by === 'customer' ? t('rejected') : t('rejectedByUser');
      case 'converted': {
        const number = String(e.values.displayNumber ?? e.values.invoiceNumber ?? '');
        const invoiceNumber = e.values.invoiceNumber;
        return t.rich('converted', {
          number,
          link: (chunks) =>
            invoiceNumber ? (
              <Link href={`/invoices/${invoiceNumber}`} dir="ltr" className="text-brand inline-block hover:underline">
                {chunks}
              </Link>
            ) : (
              <span dir="ltr" className="inline-block">
                {chunks}
              </span>
            ),
        });
      }
      default:
        return null;
    }
  }

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      <ol className="mt-4">
        {events.map((e, i) => (
          <li key={e.id} className="relative ps-6 pb-5 last:pb-0">
            {i < events.length - 1 && (
              <span aria-hidden className="bg-line-strong absolute start-[4.5px] top-4 bottom-0 w-px" />
            )}
            <span
              aria-hidden
              className="bg-brand ring-surface absolute start-0 top-1.5 size-2.5 rounded-full ring-4"
            />

            <p className="text-ink text-sm leading-6 font-bold">{text(e)}</p>
            <p className="text-muted mt-0.5 text-xs">{dateTime(e.at)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
