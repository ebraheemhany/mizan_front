import NewQuoteView from '@/component/dashbord/quotes/NewQuoteView';
import { setRequestLocale } from 'next-intl/server';

export default async function NewQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const [{ locale }, { edit }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const requestedNumber = typeof edit === 'string' ? Number(edit) : NaN;
  const editNumber =
    typeof edit === 'string' &&
    /^\d+$/.test(edit) &&
    Number.isSafeInteger(requestedNumber) &&
    requestedNumber > 0
      ? requestedNumber
      : undefined;

  return <NewQuoteView editNumber={editNumber} />;
}
