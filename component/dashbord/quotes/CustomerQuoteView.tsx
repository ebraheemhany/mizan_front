// components/quotes/CustomerQuoteView.tsx
// The customer's view of a quote, opened from its link (no login): see it, then accept
// or reject it while it is open.
'use client';

import { Check, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Logo from '@/component/Logo';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { toUiQuoteDetail, usePublicQuote, usePublicQuoteAnswer } from '@/lib/quotes/hooks';
import QuoteDocument from './QuoteDocument';
import QuoteStatusBadge from './QuoteStatusBadge';

export default function CustomerQuoteView({ token }: { token: string }) {
  const t = useTranslations('CustomerQuote');
  const tApi = useTranslations('QuotesApi');
  const errorMessage = useApiErrorMessage();
  const query = usePublicQuote(token);
  const answer = usePublicQuoteAnswer(token);

  if (query.isPending) {
    return (
      <Message>
        <Loader2 className="size-5 animate-spin" aria-label={t('loading')} />
      </Message>
    );
  }
  if (query.isError) {
    // Unknown token, or a quote that was never sent (or was deleted).
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <Message>
        <Logo />
        <h1 className="text-ink text-lg font-extrabold">{notFound ? t('invalid') : errorMessage(query.error)}</h1>
        {!notFound && (
          <Button
            variant="outline"
            onClick={() => query.refetch()}
            className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 text-xs font-bold"
          >
            {tApi('retry')}
          </Button>
        )}
      </Message>
    );
  }

  const quote = toUiQuoteDetail(query.data);
  const open = quote.status === 'sent';

  async function respond(kind: 'accept' | 'reject') {
    try {
      await answer.mutateAsync(kind);
      toast.success(kind === 'accept' ? t('accepted') : t('rejected'));
    } catch (error) {
      toast.error(errorMessage(error));
      // Answered meanwhile, or expired: show where it stands now.
      if (error instanceof ApiError && error.code === 'QUOTE_NOT_OPEN') void query.refetch();
    }
  }

  const closedMessage =
    quote.status === 'accepted'
      ? t('accepted')
      : quote.status === 'rejected'
        ? t('rejected')
        : quote.status === 'expired'
          ? t('expired')
          : t('responded');

  return (
    <div className="bg-canvas min-h-dvh">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-ink text-2xl font-extrabold sm:text-3xl">
              {t('title', { number: quote.displayNumber })}
            </h1>
            <p className="text-muted mt-1 text-xs">{tApi('sentBy', { name: quote.issuer.name })}</p>
            {open && <p className="text-muted mt-2 text-sm">{t('intro')}</p>}
          </div>
          <QuoteStatusBadge quote={quote} />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <QuoteDocument quote={quote} />

          <aside className="rounded-card border-line bg-surface space-y-4 border p-5 shadow-sm lg:sticky lg:top-6">
            {open ? (
              <>
                <Button
                  disabled={answer.isPending}
                  onClick={() => void respond('accept')}
                  className="rounded-btn bg-brand hover:bg-brand/90 h-11 w-full gap-2 text-sm font-bold text-white"
                >
                  {answer.isPending && answer.variables === 'accept' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {t('accept')}
                </Button>
                <Button
                  disabled={answer.isPending}
                  onClick={() => void respond('reject')}
                  variant="outline"
                  className="rounded-btn border-line-strong text-danger hover:bg-danger-soft h-11 w-full gap-2 text-sm font-bold"
                >
                  {answer.isPending && answer.variables === 'reject' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                  {t('reject')}
                </Button>
              </>
            ) : (
              <p className="text-ink text-sm leading-6">{closedMessage}</p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="bg-canvas text-muted flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center text-sm"
    >
      {children}
    </main>
  );
}
