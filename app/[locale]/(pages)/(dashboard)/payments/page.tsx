// app/[locale]/(pages)/(dashboard)/payments/page.tsx
import PaymentsView from '@/component/dashbord/payments/PaymentsView';
import { setRequestLocale } from 'next-intl/server';

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaymentsView />;
}