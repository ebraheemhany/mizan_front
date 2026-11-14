// components/customers/StatusBadge.tsx
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CustomerStatus } from '@/lib/mock/customers';

const STYLES: Record<CustomerStatus, string> = {
  active: 'bg-brand-soft text-brand-deep',
  overdue: 'bg-danger-soft text-danger',
  inactive: 'bg-neutral-soft text-muted',
};

export default function StatusBadge({ status }: { status: CustomerStatus }) {
  const t = useTranslations('Customers.status');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        STYLES[status],
      )}
    >
      <i className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}
