// app/[locale]/(pages)/(dashboard)/invoices/new/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import NewInvoiceView from '@/component/dashbord/invoices/NewInvoiceView';
import { setRequestLocale } from 'next-intl/server';

type SearchParams = Promise<{ fromQuote?: string | string[] }>;

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The query string is request data: read it inside Suspense (Cache Components).
  return (
    <Suspense
      fallback={
        <div className="text-muted flex justify-center py-20">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
    >
      <NewInvoiceFromUrl searchParams={searchParams} />
    </Suspense>
  );
}

// وجود fromQuote يعني أن المستخدم اختار تحويل هذا العرض إلى فاتورة.
async function NewInvoiceFromUrl({ searchParams }: { searchParams: SearchParams }) {
  const { fromQuote } = await searchParams;
  const requestedNumber = typeof fromQuote === 'string' ? Number(fromQuote) : NaN;
  const sourceQuote =
    Number.isSafeInteger(requestedNumber) && requestedNumber > 0 ? requestedNumber : undefined;
  return <NewInvoiceView sourceQuote={sourceQuote} />;
}
