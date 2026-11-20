// app/[locale]/(pages)/(dashboard)/quotes/new/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import NewQuoteView from '@/component/dashbord/quotes/NewQuoteView';

type SearchParams = Promise<{ edit?: string | string[] }>;

export default async function NewQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  setRequestLocale((await params).locale);

  // The query string is request data: read it inside Suspense (Cache Components).
  return (
    <Suspense fallback={<RouteLoading />}>
      <NewQuote searchParams={searchParams} />
    </Suspense>
  );
}

async function NewQuote({ searchParams }: { searchParams: SearchParams }) {
  const { edit } = await searchParams;
  const requestedNumber = typeof edit === 'string' ? Number(edit) : NaN;
  const editNumber =
    typeof edit === 'string' && /^\d+$/.test(edit) && Number.isSafeInteger(requestedNumber) && requestedNumber > 0
      ? requestedNumber
      : undefined;

  return <NewQuoteView editNumber={editNumber} />;
}
