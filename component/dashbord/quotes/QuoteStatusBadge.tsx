// components/quotes/QuoteStatusBadge.tsx
import { useTranslations } from 'next-intl';
import { displayStatus, type Quote, type QuoteDisplayStatus } from '@/lib/quotes/hooks';
import { cn } from '@/lib/utils';

const STYLES: Record<QuoteDisplayStatus, string> = {
  draft: 'bg-neutral-soft text-muted',
  sent: 'bg-info-soft text-info',
  expiringSoon: 'bg-amber-100 text-amber-800',
  accepted: 'bg-brand-soft text-brand-deep',
  rejected: 'bg-neutral-soft text-ink-2',
  expired: 'bg-danger-soft text-danger',
};

export default function QuoteStatusBadge({ quote }: { quote: Pick<Quote, 'status' | 'daysLeft'> }) {
  const t = useTranslations('Quotes.status');
  const status = displayStatus(quote);

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
