// components/dashboard/DashboardView.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PageHeader from '@/component/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { formToInput, useCreateCustomer, useTeamDirectory } from '@/lib/customers/hooks';
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
  const user = useSession();
  const canAddCustomer = can(user.role, 'editCustomers');
  const canIssueInvoices = can(user.role, 'issueInvoices');
  const canWorkDeals = can(user.role, 'deals');
  const directory = useTeamDirectory();
  const createCustomer = useCreateCustomer();
  const errorMessage = useApiErrorMessage();
  const firstName = user.fullName.trim().split(/\s+/)[0];

  async function addCustomer(values: CustomerFormValues) {
    try {
      await createCustomer.mutateAsync(formToInput(values));
      setAddCustomerOpen(false);
      toast.success(tCustomers('toasts.added', { name: values.name }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  // Today in Egypt (the business day), whatever the device's time zone.
  const today = format.dateTime(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'Africa/Cairo',
  });

  return (
    // Its blocks arrive one after another, quickly (globals.css: [data-stagger]).
    <div data-stagger className="space-y-5">
      <PageHeader
        title={t('greeting', { name: firstName })}
        description={t('subtitle', { date: today })}
        actions={
          <>
            {/* الموبايل: زرار فاتورة جديدة بعرض الشاشة زي التصميم */}
            {canIssueInvoices && (
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
            )}

            {canAddCustomer && (
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
            )}
            {canWorkDeals && (
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
            )}
          </>
        }
      />

      <DashboardStats />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RevenueChart />
        <AttentionList />
      </div>

      <RecentInvoices />

      {canAddCustomer && (
        <AddCustomerSheet
          open={addCustomerOpen}
          onOpenChange={setAddCustomerOpen}
          owners={directory.data ?? []}
          defaultOwnerId={user.id}
          onSubmit={addCustomer}
        />
      )}
    </div>
  );
}