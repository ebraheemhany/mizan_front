// app/[locale]/(pages)/(dashboard)/quotes/page.tsx
import QuotesView from '@/component/dashbord/quotes/QuotesView';
import { setRequestLocale } from 'next-intl/server';


export default async function QuotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <QuotesView />;
}
