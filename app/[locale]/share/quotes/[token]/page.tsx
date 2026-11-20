// app/[locale]/share/quotes/[token]/page.tsx
// The quote link shared with the customer (no login). [token] is the quote's random
// public token (not its number), so other quotes can't be found by guessing.
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import CustomerQuoteView from '@/component/dashbord/quotes/CustomerQuoteView';

type Params = Promise<{ locale: string; token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'QuoteDetail' });

  return {
    title: t('title'),
    // Only for the customer: keep it out of search engines.
    robots: { index: false, follow: false },
  };
}

// The token in the URL is request data: read it inside Suspense (Cache Components).
export default function SharedQuotePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading fullScreen />}>
      <SharedQuote params={params} />
    </Suspense>
  );
}

async function SharedQuote({ params }: { params: Params }) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return <CustomerQuoteView token={token} />;
}
