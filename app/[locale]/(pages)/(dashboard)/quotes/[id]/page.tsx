// app/[locale]/(pages)/(dashboard)/quotes/[id]/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import QuoteDetailView from '@/component/dashbord/quotes/QuoteDetailView';

type Params = Promise<{ locale: string; id: string }>;

// The URL's id is request data: read it inside Suspense (Cache Components).
export default function QuoteDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <QuoteDetail params={params} />
    </Suspense>
  );
}

async function QuoteDetail({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const parsedNumber = Number(id);
  const number =
    /^\d+$/.test(id) && Number.isSafeInteger(parsedNumber) && parsedNumber > 0 ? parsedNumber : 0;
  return <QuoteDetailView number={number} />;
}
