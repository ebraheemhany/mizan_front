// app/[locale]/(public)/i/[id]/page.tsx
// The invoice link shared with the customer. [id] is the invoice's random public
// token (not its number), so other invoices can't be found by guessing.
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import PublicInvoiceLoader from '@/component/dashbord/invoices/PublicInvoiceLoader';

type Params = Promise<{ locale: string; id: string }>;
type Props = { params: Params };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'InvoiceDetail' });

  return {
    title: t('title'),
    // الصفحة دي للعميل بس، فمنمنعش محركات البحث تفهرسها
    robots: { index: false, follow: false },
  };
}

// The token in the URL is request data: read it inside Suspense (Cache Components).
export default function PublicInvoicePage({ params }: Props) {
  return (
    <Suspense fallback={<RouteLoading fullScreen />}>
      <PublicInvoice params={params} />
    </Suspense>
  );
}

async function PublicInvoice({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!/^[\w-]{20,100}$/.test(id)) notFound();

  return <PublicInvoiceLoader token={id} />;
}
