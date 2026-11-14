// app/[locale]/(app)/invoices/page.tsx
import InvoicesView from '@/component/dashbord/invoices/InvoicesView';
import { setRequestLocale } from 'next-intl/server';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <InvoicesView />;
}
