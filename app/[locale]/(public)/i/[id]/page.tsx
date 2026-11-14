// app/[locale]/(public)/i/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getInvoiceDetail } from '@/lib/mock/invoice-details';
import PublicInvoiceView from '@/component/dashbord/invoices/PublicInvoiceView';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'InvoiceDetail' });

  return {
    title: `${t('title')} #${id}`,
    // الصفحة دي للعميل بس، فمنمنعش محركات البحث تفهرسها
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const invoice = getInvoiceDetail(Number(id));

  // المسودات مش بتتشارك مع العميل
  if (!invoice || invoice.status === 'draft') notFound();

  return <PublicInvoiceView invoice={invoice} />;
}
