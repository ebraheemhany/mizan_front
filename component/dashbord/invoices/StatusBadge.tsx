// components/invoices/StatusBadge.tsx
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/lib/mock/invoices';

const STYLES: Record<InvoiceStatus, string> = {
  draft: 'bg-neutral-soft text-muted',
  sent: 'bg-info-soft text-info',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-brand-soft text-brand-deep',
  overdue: 'bg-danger-soft text-danger',
  cancelled: 'bg-neutral-soft text-muted',
};

export default function StatusBadge({
  status,
  daysOverdue,
}: Pick<Invoice, 'status' | 'daysOverdue'>) {
  const t = useTranslations('Invoices.status');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        STYLES[status],
      )}
    >
      <i className="size-1.5 rounded-full bg-current" />
      {status === 'overdue' && daysOverdue
        ? t('overdueDays', { days: daysOverdue })
        : t(status)}
    </span>
  );
}
