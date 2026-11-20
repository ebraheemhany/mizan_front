// app/[locale]/(pages)/(dashboard)/invoices/recurring/[id]/edit/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import { getRecurringFormValues } from '@/lib/mock/recurring';
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

  const initial = getRecurringFormValues(id);
  if (!initial) notFound();

  return <RecurringFormView key={id} mode="edit" initial={initial} />;
}
