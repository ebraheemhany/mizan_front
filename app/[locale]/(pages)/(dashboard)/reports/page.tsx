// app/[locale]/(pages)/(dashboard)/reports/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import ReportsView from '@/component/dashbord/reports/ReportsView';
import { parseReportsSearch } from '@/component/dashbord/reports/utils';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The query string is request data: read it inside Suspense (Cache Components).
  return (
    <Suspense
      fallback={
        <div className="text-muted flex justify-center py-20">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
    >
      <ReportsFromUrl searchParams={searchParams} />
    </Suspense>
  );
}

/** ?tab=&period=&customer= as the page's starting state (unknown values fall back to the defaults). */
async function ReportsFromUrl({ searchParams }: { searchParams: SearchParams }) {
  return <ReportsView initial={parseReportsSearch(await searchParams)} />;
}
