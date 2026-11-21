// components/dashboard/AttentionList.tsx
'use client';

import { FileSignature, Kanban, Receipt, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { AttentionType } from '@/lib/mock/dashboard';
import { useDashboard } from '@/lib/payments/hooks';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

const STYLES: Record<AttentionType, { icon: LucideIcon; box: string; days: string }> = {
  invoiceOverdue: { icon: Receipt, box: 'bg-danger-soft text-danger', days: 'text-danger' },
  staleDeal: { icon: Kanban, box: 'bg-amber-100 text-amber-800', days: 'text-amber-700' },
  pendingQuote: { icon: FileSignature, box: 'bg-info-soft text-info', days: 'text-amber-700' },
};

export default function AttentionList() {
  const t = useTranslations('Dashboard.attention');
  const money = useMoney();
  const { data } = useDashboard();
  // Overdue invoices, then deals that went quiet.
  const items = (data?.attention ?? []).map((a) => ({
    id: a.id,
    type: a.type as AttentionType,
    number: a.number,
    title: a.displayNumber,
    customer: a.customer,
    amount: Number(a.amount),
    days: a.days,
    href: a.type === 'staleDeal' ? '/deals' : `/invoices/${a.number}`,
  }));

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      {items.length === 0 ? (
        <p className="text-muted mt-4 py-6 text-center text-sm">{t('empty')}</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {items.map((item) => {
            const { icon: Icon, box, days } = STYLES[item.type];

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="hover:bg-canvas -mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors"
                >
                  <span className={cn('flex size-[38px] shrink-0 items-center justify-center rounded-lg', box)}>
                    <Icon className="size-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate text-sm font-bold">
                      {t(item.type, { number: String(item.number ?? ''), title: item.title ?? '' })}
                    </span>
                    <span className="text-muted block truncate text-xs">
                      {t('item', { customer: item.customer, amount: money(item.amount) })}
                    </span>
                  </span>

                  <span className={cn('shrink-0 text-xs font-bold', days)}>
                    {t('days', { count: item.days })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}