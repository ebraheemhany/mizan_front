// components/customers/CustomerDetailView.tsx
'use client';

import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Amount from '@/component/Amount';
import PageHeader from '@/component/PageHeader';
import StatCard from '@/component/StatCard';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import type { CustomerDetail } from '@/lib/mock/customer-details';
import { formatDaysAgo } from '@/lib/relative-time';
import { cn } from '@/lib/utils';
import CustomerAvatar from './CustomerAvatar';
import CustomerInfoCard from './CustomerInfoCard';
import CustomerInvoicesCard from './CustomerInvoicesCard';
import CustomerStatusBadge from './StatusBadge';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

export default function CustomerDetailView({
  detail,
}: {
  detail: CustomerDetail;
}) {
  const t = useTranslations('CustomerDetail');
  const locale = useLocale();
  const user = useSession();
  const {
    customer,
    ownerName,
    invoices,
    billableCount,
    totalInvoiced,
    collected,
  } = detail;

  const subtitle = [customer.city, ownerName && t('owner', { name: ownerName })]
    .filter(Boolean)
    .join(' · ');

  const overdue = customer.status === 'overdue';
  const balanceHint =
    customer.balance === 0
      ? t('stats.balanceClear')
      : overdue
        ? t('stats.balanceOverdue')
        : t('stats.balanceDue');

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <CustomerAvatar
              id={customer.id}
              name={customer.name}
              className="size-11 text-lg"
            />
            <span className="min-w-0">{customer.name}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CustomerStatusBadge status={customer.status} />
            {subtitle && <span>{subtitle}</span>}
          </span>
        }
        actions={
          <>
            <Link
              href="/customers"
              className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Link>
            {/* The customer's account statement (reports are for owner + accountant). */}
            {can(user.role, 'reports') && (
              <Link
                href={`/reports?tab=statement&customer=${customer.id}`}
                className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
              >
                <FileText className="size-4" />
                {t('statement')}
              </Link>
            )}
            <Link
              href="/invoices/new"
              className={cn(buttonVariants(), primaryBtn)}
            >
              <Plus className="size-4" />
              {t('newInvoice')}
            </Link>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label={t('stats.balance')}
              value={<Amount amount={customer.balance} />}
              hint={balanceHint}
              tone={overdue && customer.balance > 0 ? 'danger' : 'default'}
            />
            <StatCard
              label={t('stats.invoiced')}
              value={<Amount amount={totalInvoiced} />}
              hint={t('stats.invoicedHint', { count: billableCount })}
            />
            <StatCard
              label={t('stats.collected')}
              value={<Amount amount={collected} />}
              hint={t('stats.collectedHint', {
                when: formatDaysAgo(locale, customer.lastActivityDaysAgo),
              })}
              tone="brand"
            />
          </div>

          <CustomerInvoicesCard invoices={invoices} />
        </div>

        <aside className="space-y-5">
          <CustomerInfoCard detail={detail} />
        </aside>
      </div>
    </div>
  );
}
