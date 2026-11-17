// app/[locale]/(pages)/(dashboard)/invoices/[id]/page.tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import InvoiceDetailView from '@/component/dashbord/invoices/InvoiceDetailView';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // /invoices/1038 (number) or /invoices/i1038 (old links). Data comes from the API in the browser.
  const match = /^i?(\d{1,9})$/.exec(id);
  if (!match) notFound();

  return <InvoiceDetailView key={match[1]} invoiceRef={match[1]} />;
}
