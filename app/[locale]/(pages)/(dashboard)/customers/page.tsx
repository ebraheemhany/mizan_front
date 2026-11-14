// app/[locale]/(app)/customers/page.tsx
import CustomersView from '@/component/dashbord/customers/CustomersView';
import { setRequestLocale } from 'next-intl/server';


export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomersView />;
}