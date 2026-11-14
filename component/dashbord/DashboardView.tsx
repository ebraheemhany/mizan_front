// components/dashboard/DashboardView.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PageHeader from '@/component/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { CURRENT_USER } from '@/lib/mock/dashboard';
import { MOCK_NOW } from '@/lib/mock/invoices';
import type { CustomerFormValues } from '@/lib/validations/customer';
import { cn } from '@/lib/utils';
import AttentionList from './AttentionList';
import DashboardStats from './DashboardStats';
import RecentInvoices from './RecentInvoices';
import RevenueChart from './RevenueChart';
import AddCustomerSheet from './customers/AddCustomerSheet';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function DashboardView() {
  const t = useTranslations('Dashboard');
  const tCustomers = useTranslations('Customers');
  const format = useFormatter();
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  function addCustomer(values: CustomerFormValues) {
    setAddCustomerOpen(false);
    toast.success(tCustomers('toasts.added', { name: values.name }));
  }

  // TODO: التاريخ الحقيقي لما نربط الـ API
  const today = format.dateTime(MOCK_NOW, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('greeting', { name: CURRENT_USER.firstName })}
        description={t('subtitle', { date: today })}
        actions={
          <>
            {/* الموبايل: زرار فاتورة جديدة بعرض الشاشة زي التصميم */}
            <Link
              href="/invoices/new"
              className={cn(
                buttonVariants(),
                primaryBtn,
                'h-11 w-full text-sm sm:hidden',
              )}
            >
              <Plus className="size-4" />
              {t('newInvoice')}
            </Link>

            <button
              type="button"
              onClick={() => setAddCustomerOpen(true)}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                outlineBtn,
                'hidden sm:inline-flex',
              )}
            >
              {t('addCustomer')}
            </button>
            <Link
              href="/deals"
              className={cn(
                buttonVariants(),
                primaryBtn,
                'hidden sm:inline-flex',
              )}
            >
              {t('newDeal')}
            </Link>
          </>
        }
      />

      <DashboardStats />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RevenueChart />
        <AttentionList />
      </div>

      <RecentInvoices />

      <AddCustomerSheet
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        onSubmit={addCustomer}
      />
    </div>
  );
}