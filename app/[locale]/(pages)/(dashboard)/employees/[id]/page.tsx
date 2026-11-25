// app/[locale]/(pages)/(dashboard)/employees/[id]/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';

import RouteLoading from '@/component/RouteLoading';
import EmployeeDetailView from '@/component/dashbord/employees/EmployeeDetailView';

type Params = Promise<{ locale: string; id: string }>;

// The URL's id is request data: read it inside Suspense (Cache Components).
export default function EmployeePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Employee params={params} />
    </Suspense>
  );
}

async function Employee({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  // Data comes from the API in the browser (it needs the user's access token).
  return <EmployeeDetailView key={id} id={id} />;
}
