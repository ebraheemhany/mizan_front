// app/[locale]/(pages)/(dashboard)/invoices/new/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import NewInvoiceView from '@/component/dashbord/invoices/NewInvoiceView';
import { setRequestLocale } from 'next-intl/server';

type Param = string | string[] | undefined;
type SearchParams = Promise<{ fromQuote?: Param; customer?: Param; customerName?: Param; item?: Param; price?: Param }>;

const one = (v: Param) => (typeof v === 'string' ? v : undefined);

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
  const { fromQuote, customer, customerName, item, price } = await searchParams;
  const requestedNumber = typeof fromQuote === 'string' ? Number(fromQuote) : NaN;
  const sourceQuote =
    Number.isSafeInteger(requestedNumber) && requestedNumber > 0 ? requestedNumber : undefined;
  // From a won deal: its customer, and one line with its title and value.
  const customerId = one(customer);
  const prefill =
    customerId && /^[0-9a-f-]{36}$/i.test(customerId)
      ? {
          customerId,
          customerName: one(customerName)?.slice(0, 150) ?? '',
          description: one(item)?.slice(0, 200) ?? '',
          unitPrice: /^\d{1,12}(\.\d{1,2})?$/.test(one(price) ?? '') ? one(price)! : '',
        }
      : undefined;
  return <NewInvoiceView sourceQuote={sourceQuote} prefill={sourceQuote ? undefined : prefill} />;
}
