// app/[locale]/(pages)/(dashboard)/payroll/[month]/page.tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';

import RouteLoading from '@/component/RouteLoading';
import PayrollRunView from '@/component/dashbord/payroll/PayrollRunView';

type Params = Promise<{ locale: string; month: string }>;

export default function PayrollMonthPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PayrollMonth params={params} />
    </Suspense>
  );
}

async function PayrollMonth({ params }: { params: Params }) {
  const { locale, month } = await params;
  setRequestLocale(locale);
  return <PayrollRunView key={month} month={month} />;
}
