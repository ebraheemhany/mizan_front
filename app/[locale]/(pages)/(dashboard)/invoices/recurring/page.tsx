// app/[locale]/(pages)/(dashboard)/invoices/recurring/page.tsx
import RecurringView from '@/component/recurring/RecurringView';
import { setRequestLocale } from 'next-intl/server';

export default async function RecurringInvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecurringView />;
}
