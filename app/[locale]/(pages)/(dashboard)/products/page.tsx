// app/[locale]/(pages)/(dashboard)/products/page.tsx
import ProductsView from '@/component/dashbord/products/ProductsView';
import { setRequestLocale } from 'next-intl/server';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductsView />;
}
