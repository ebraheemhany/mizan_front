// app/[locale]/(pages)/(dashboard)/reports/page.tsx
import ReportsView from '@/component/dashbord/reports/ReportsView';
import { setRequestLocale } from 'next-intl/server';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReportsView />;
}
