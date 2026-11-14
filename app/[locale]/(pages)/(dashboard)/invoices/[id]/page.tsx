// app/[locale]/(app)/invoices/[number]/page.tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getInvoiceDetail } from '@/lib/mock/invoice-details';
import InvoiceDetailView from '@/component/dashbord/invoices/InvoiceDetailView';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const invoiceId = /^i?(\d+)$/.exec(id);
  if (!invoiceId) notFound();

  const invoice = getInvoiceDetail(Number(invoiceId[1]));
  if (!invoice) notFound();

  return <InvoiceDetailView key={invoice.number} invoice={invoice} />;
}