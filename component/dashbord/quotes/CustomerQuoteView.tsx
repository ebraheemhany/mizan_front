'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createQuoteDetail } from '@/lib/mock/quote-details';
import {
  effectiveStatus,
  quoteLabel,
  TODAY,
  type QuoteStatus,
} from '@/lib/mock/quotes';
import { useQuotes } from './QuotesProvider';
import QuoteDocument from './QuoteDocument';
import QuoteStatusBadge from './QuoteStatusBadge';

export default function CustomerQuoteView({ token }: { token: string }) {
  const t = useTranslations('CustomerQuote');
  const locale = useLocale();
  const { quotes, setQuotes, hydrated } = useQuotes();
  const quote = quotes.find((item) => item.shareToken === token);
  const details = useMemo(
    () => (quote ? createQuoteDetail(quote) : undefined),
    [quote],
  );
  const status = quote ? effectiveStatus(quote) : undefined;

  function respond(nextStatus: Extract<QuoteStatus, 'accepted' | 'rejected'>) {
    if (!quote || effectiveStatus(quote) !== 'sent') return;

    setQuotes((currentQuotes) =>
      currentQuotes.map((item) =>
        item.id === quote.id
          ? {
              ...item,
              status: nextStatus,
              sentDate: item.sentDate ?? item.issueDate,
              acceptedDate: nextStatus === 'accepted' ? TODAY : undefined,
              rejectedDate: nextStatus === 'rejected' ? TODAY : undefined,
            }
          : item,
      ),
    );
  }

  if (!hydrated) {
    return <Message>{t('loading')}</Message>;
  }

  if (!quote || !details) {
    return <Message>{t('invalid')}</Message>;
  }

  const canRespond = status === 'sent';
  const expired = status === 'expired';

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="bg-canvas min-h-dvh px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-card border-line bg-surface border p-5 shadow-sm sm:p-7">
          <p className="text-brand text-sm font-extrabold">{t('company')}</p>
          <p className="bg-amber-50 text-amber-900 mt-3 rounded-lg px-3 py-2 text-xs leading-5">
            {t('demoNotice')}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-ink text-2xl font-extrabold">
                {t('title', { number: quoteLabel(quote.number) })}
              </h1>
              <p className="text-muted mt-2 text-sm">{t('intro')}</p>
            </div>
            <QuoteStatusBadge quote={quote} />
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <QuoteDocument quote={details} />

          <aside className="rounded-card border-line bg-surface space-y-4 border p-5 shadow-sm">
            {canRespond ? (
              <>
                <Button
                  onClick={() => respond('accepted')}
                  className="rounded-btn bg-brand hover:bg-brand/90 h-11 w-full gap-2 text-sm font-bold text-white"
                >
                  <Check className="size-4" />
                  {t('accept')}
                </Button>
                <Button
                  onClick={() => respond('rejected')}
                  variant="outline"
                  className="rounded-btn border-line-strong text-danger hover:bg-danger-soft h-11 w-full gap-2 text-sm font-bold"
                >
                  <X className="size-4" />
                  {t('reject')}
                </Button>
              </>
            ) : (
              <p className="text-ink text-sm leading-6">
                {expired
                  ? t('expired')
                  : status === 'accepted'
                    ? t('accepted')
                    : status === 'rejected'
                      ? t('rejected')
                      : t('responded')}
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="bg-canvas text-muted flex min-h-dvh items-center justify-center px-4 text-center text-sm"
    >
      {children}
    </main>
  );
}
