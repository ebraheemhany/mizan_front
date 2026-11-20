// app/[locale]/share/quotes/[token]/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import CustomerQuoteView from '@/component/dashbord/quotes/CustomerQuoteView';

type Params = Promise<{ locale: string; token: string }>;

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
