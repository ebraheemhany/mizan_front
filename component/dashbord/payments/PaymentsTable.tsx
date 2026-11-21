// component/dashbord/payments/PaymentsTable.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import type { Payment } from '@/lib/mock/payments';

const th = 'text-ink-2 px-4 py-3 text-start text-xs font-bold';
const td = 'px-4 py-3.5 text-xs';

export default function PaymentsTable({
  rows,
  onClear,
  onBounce,
}: {
  rows: Payment[];
  /** Marks a pending cheque as cleared. Omitted when the user's role can't record payments. */
  onClear?: (payment: Payment) => void;
  /** Marks a pending cheque as bounced (asks first). Omitted like onClear. */
  onBounce?: (payment: Payment) => void;
}) {
  const t = useTranslations('Payments');
  const tApi = useTranslations('PaymentsApi');
  const format = useFormatter();
  const money = useMoney();

  const date = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="bg-neutral-soft/70">
          <tr>
            <th className={th}>{t('table.number')}</th>
            <th className={th}>{t('table.invoice')}</th>
            <th className={th}>{t('table.customer')}</th>
            <th className={th}>{t('table.date')}</th>
            <th className={th}>{t('table.method')}</th>
            <th className={th}>{t('table.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-line/70 border-t">
              <td className={cn(td, 'text-ink-2 font-semibold tabular-nums')}>
                {p.number}
              </td>
              <td className={cn(td, 'text-brand-deep font-extrabold tabular-nums')}>
                <Link href={`/invoices/${p.invoiceNo}`} className="hover:underline">
                  #{format.number(p.invoiceNo, {
                    useGrouping: false,
                    numberingSystem: 'latn',
                  })}
                </Link>
              </td>
              <td className={cn(td, 'text-ink font-bold')}>{p.customer}</td>
              <td className={cn(td, 'text-ink-2 tabular-nums')}>
                {date(p.date)}
              </td>
              <td className={cn(td, 'text-ink-2')}>
                <span className="inline-flex items-center gap-2">
                  {t(`methods.${p.method}`)}
                  {p.status === 'pending' && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {t('status.pending')}
                    </span>
                  )}
                  {p.status === 'pending' && onClear && (
                    <button
                      type="button"
                      onClick={() => onClear(p)}
                      className="text-brand-deep hover:bg-brand-soft rounded-full border border-brand-mint px-2 py-0.5 text-[10px] font-bold"
                    >
                      {tApi('markCleared')}
                    </button>
                  )}
                  {p.status === 'pending' && onBounce && (
                    <button
                      type="button"
                      onClick={() => onBounce(p)}
                      className="text-danger hover:bg-danger-soft border-danger/30 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                    >
                      {tApi('markBounced')}
                    </button>
                  )}
                  {p.status === 'bounced' && (
                    <span className="bg-danger-soft text-danger rounded-full px-2 py-0.5 text-[10px] font-bold">
                      {t('status.bounced')}
                    </span>
                  )}
                </span>
              </td>
              <td
                className={cn(
                  td,
                  'font-bold tabular-nums',
                  p.status === 'bounced' ? 'text-muted line-through' : 'text-ink',
                )}
              >
                {money(p.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}