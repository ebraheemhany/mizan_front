// app/[locale]/(pages)/(dashboard)/customers/[id]/page.tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCustomerDetail } from '@/lib/mock/customer-details';
import CustomerDetailView from '@/component/dashbord/customers/CustomerDetailView';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const detail = getCustomerDetail(id);
  if (!detail) notFound();

  return <CustomerDetailView key={id} detail={detail} />;
}
