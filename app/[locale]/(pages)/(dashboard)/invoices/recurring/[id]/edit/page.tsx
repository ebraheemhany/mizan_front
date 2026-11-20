// app/[locale]/(pages)/(dashboard)/invoices/recurring/[id]/edit/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import RecurringFormView from '@/component/recurring/RecurringFormView';

type Params = Promise<{ locale: string; id: string }>;

// The URL's id is request data: read it inside Suspense (Cache Components).
export default function EditRecurringPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <EditRecurring params={params} />
    </Suspense>
  );
}

async function EditRecurring({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // The template comes from the API in the browser (it needs the user's access token).
  return <RecurringFormView key={id} templateId={id} />;
}
