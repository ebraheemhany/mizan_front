// app/[locale]/(pages)/(dashboard)/admin/companies/[id]/page.tsx
// One company, for Mizan's own staff.
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import AdminCompanyView from '@/component/admin/AdminCompanyView';

type Params = Promise<{ locale: string; id: string }>;

// The URL's id is request data: read it inside Suspense (Cache Components).
export default function AdminCompanyPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AdminCompany params={params} />
    </Suspense>
  );
}

async function AdminCompany({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <AdminCompanyView id={id} />;
}
