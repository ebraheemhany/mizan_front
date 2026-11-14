// components/quotes/QuoteHistory.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useDate } from '@/lib/data';
import type { QuoteEvent } from '@/lib/mock/quote-details';

export default function QuoteHistory({
  events,
  customer,
}: {
  events: QuoteEvent[];
  customer: string;
}) {
  const t = useTranslations('QuoteDetail.history');
  const date = useDate();

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      <ol className="mt-4">
        {events.map((e, i) => (
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

            <p className="text-ink text-sm leading-6 font-bold">
              {t(e.type, { customer })}
            </p>
            <p className="text-muted mt-0.5 text-xs">{date(e.at)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
