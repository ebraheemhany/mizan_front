// component/dashbord/customers/CustomerDetailLoader.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { toUiCustomer, useCustomer } from '@/lib/customers/hooks';
import { cn } from '@/lib/utils';
import CustomerDetailView from './CustomerDetailView';

/** Loads one customer from the API and shows the detail page. */
export default function CustomerDetailLoader({ id }: { id: string }) {
  const t = useTranslations('CustomersApi');
  const query = useCustomer(id);

  if (query.isPending) {
    return (
      <div className="text-muted flex justify-center py-20">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="rounded-card border-line bg-surface mx-auto max-w-md space-y-3 border p-8 text-center shadow-sm">
        <h1 className="text-ink text-lg font-extrabold">{notFound ? t('notFoundTitle') : t('loadError')}</h1>
        {notFound && <p className="text-muted text-sm">{t('notFoundBody')}</p>}
        <div className="flex justify-center gap-2 pt-2">
          {!notFound && (
            <Button variant="outline" className="rounded-btn h-10 text-xs font-bold" onClick={() => query.refetch()}>
              {t('retry')}
            </Button>
          )}
          <Link href="/customers" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-btn h-10 text-xs font-bold')}>
            {t('backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const customer = query.data;
  return (
    <CustomerDetailView
      detail={{
        customer: toUiCustomer(customer),
        ownerName: customer.assignedTo?.fullName ?? '',
        // Filled in once invoices exist on the backend.
        invoices: [],
        billableCount: 0,
        totalInvoiced: 0,
        collected: 0,
      }}
    />
  );
}
