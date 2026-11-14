// app/[locale]/(pages)/(dashboard)/expenses/page.tsx
import ExpensesView from '@/component/dashbord/expenses/ExpensesView';
import { setRequestLocale } from 'next-intl/server';

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExpensesView />;
}