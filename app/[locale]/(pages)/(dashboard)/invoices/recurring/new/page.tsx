// app/[locale]/(pages)/(dashboard)/invoices/recurring/new/page.tsx
import NewRecurringView from '@/component/recurring/RecurringFormView';
import { setRequestLocale } from 'next-intl/server';

export default async function NewRecurringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewRecurringView />;
}
