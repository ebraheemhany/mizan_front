// app/[locale]/(pages)/(dashboard)/invoices/new/page.tsx
import NewInvoiceView from '@/component/dashbord/invoices/NewInvoiceView';
import { setRequestLocale } from 'next-intl/server';

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fromQuote?: string | string[] }>;
}) {
  const { locale } = await params;
  const { fromQuote } = await searchParams;
  const requestedNumber =
    typeof fromQuote === 'string' ? Number(fromQuote) : NaN;
  const sourceQuote =
    Number.isSafeInteger(requestedNumber) && requestedNumber > 0
      ? requestedNumber
      : undefined;
  setRequestLocale(locale);

  // وجود fromQuote يعني أن المستخدم اختار تحويل هذا العرض إلى فاتورة.
  return (
    <NewInvoiceView
      sourceQuote={sourceQuote}
    />
  );
}
