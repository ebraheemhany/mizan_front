// app/[locale]/(pages)/(dashboard)/billing/return/page.tsx
// Where Paymob's checkout sends the owner back (?payment=<our payment id>).
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import BillingReturnView from '@/component/dashbord/settings/BillingReturnView';

export default async function BillingReturnPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    // The view reads ?payment= in the browser (useSearchParams), which needs a Suspense boundary.
    <Suspense fallback={<RouteLoading />}>
      <BillingReturnView />
    </Suspense>
  );
}
