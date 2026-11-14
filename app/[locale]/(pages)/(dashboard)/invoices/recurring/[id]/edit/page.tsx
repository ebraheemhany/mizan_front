// app/[locale]/(pages)/(dashboard)/invoices/recurring/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getRecurringFormValues } from '@/lib/mock/recurring';
import RecurringFormView from '@/component/recurring/RecurringFormView';

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const initial = getRecurringFormValues(id);
  if (!initial) notFound();

  return <RecurringFormView key={id} mode="edit" initial={initial} />;
}
