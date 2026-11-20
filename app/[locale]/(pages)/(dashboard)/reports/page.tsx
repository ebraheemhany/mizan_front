// app/[locale]/(pages)/(dashboard)/reports/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import ReportsView from '@/component/dashbord/reports/ReportsView';

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The view reads ?tab=&period=&customer= in the browser (useSearchParams), which
  // needs a Suspense boundary to keep the rest of the page prerendered.
  return (
    <Suspense fallback={<RouteLoading />}>
      <ReportsView />
    </Suspense>
  );
}
