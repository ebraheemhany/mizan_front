// app/[locale]/(pages)/(dashboard)/customers/[id]/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';

import RouteLoading from '@/component/RouteLoading';
import CustomerDetailLoader from '@/component/dashbord/customers/CustomerDetailLoader';

type Params = Promise<{ locale: string; id: string }>;

// The URL's id is request data: read it inside Suspense (Cache Components).
export default function CustomerDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <CustomerDetail params={params} />
    </Suspense>
  );
}

async function CustomerDetail({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Data comes from the API in the browser (it needs the user's access token).
  return <CustomerDetailLoader key={id} id={id} />;
}
