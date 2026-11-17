// app/[locale]/(public)/i/[id]/page.tsx
// The invoice link shared with the customer. [id] is the invoice's random public
// token (not its number), so other invoices can't be found by guessing.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PublicInvoiceLoader from '@/component/dashbord/invoices/PublicInvoiceLoader';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'InvoiceDetail' });

  return {
    title: t('title'),
    // الصفحة دي للعميل بس، فمنمنعش محركات البحث تفهرسها
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!/^[\w-]{20,100}$/.test(id)) notFound();

  return <PublicInvoiceLoader token={id} />;
}
