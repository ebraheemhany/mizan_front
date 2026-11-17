// app/[locale]/(pages)/(dashboard)/customers/[id]/page.tsx
import { setRequestLocale } from 'next-intl/server';

import CustomerDetailLoader from '@/component/dashbord/customers/CustomerDetailLoader';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Data comes from the API in the browser (it needs the user's access token).
  return <CustomerDetailLoader key={id} id={id} />;
}
