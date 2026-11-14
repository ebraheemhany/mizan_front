// app/[locale]/(pages)/(dashboard)/quotes/[id]/page.tsx
import { setRequestLocale } from 'next-intl/server';
import QuoteDetailView from '@/component/dashbord/quotes/QuoteDetailView';

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const parsedNumber = Number(id);
  const number =
    /^\d+$/.test(id) &&
    Number.isSafeInteger(parsedNumber) &&
    parsedNumber > 0
      ? parsedNumber
      : 0;
  return <QuoteDetailView number={number} />;
}
