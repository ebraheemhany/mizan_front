// app/[locale]/(pages)/(dashboard)/deals/page.tsx
import DealsView from '@/component/dashbord/deals/DealsView';
import { setRequestLocale } from 'next-intl/server';
;

export default async function DealsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DealsView />;
}
