// app/[locale]/(pages)/(dashboard)/invoices/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import RouteLoading from '@/component/RouteLoading';
import InvoiceDetailView from '@/component/dashbord/invoices/InvoiceDetailView';

type Params = Promise<{ locale: string; id: string }>;

// The URL's id is request data: read it inside Suspense (Cache Components).
export default function InvoiceDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <InvoiceDetail params={params} />
    </Suspense>
  );
}

async function InvoiceDetail({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // /invoices/1038 (number) or /invoices/i1038 (old links). Data comes from the API in the browser.
  const match = /^i?(\d{1,9})$/.exec(id);
  if (!match) notFound();

  return <InvoiceDetailView key={match[1]} invoiceRef={match[1]} />;
}
