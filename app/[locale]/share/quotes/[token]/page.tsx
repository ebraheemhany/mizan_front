import CustomerQuoteView from '@/component/dashbord/quotes/CustomerQuoteView';
import { setRequestLocale } from 'next-intl/server';

export default async function SharedQuotePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return <CustomerQuoteView token={token} />;
}
