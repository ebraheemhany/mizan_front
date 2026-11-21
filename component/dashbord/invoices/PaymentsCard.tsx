// components/invoices/PaymentsCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useDate } from '@/lib/data';
import type { Payment } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';

export default function PaymentsCard({ payments }: { payments: Payment[] }) {
  const t = useTranslations('InvoiceDetail.payments');
  const tStatus = useTranslations('Payments.status');
  const money = useMoney();
  const date = useDate();

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      {payments.length === 0 ? (
        <p className="text-muted mt-3 text-xs">{t('empty')}</p>
      ) : (
        <ul className="divide-line mt-3 divide-y">
          {payments.map((p) => (
            <li key={p.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-brand-deep text-sm font-extrabold tabular-nums">
                  {money(p.amount)}
                </p>
                {p.number && (
                  <span dir="ltr" className="text-muted text-[11px] tabular-nums">
                    {p.number}
                  </span>
                )}
              </div>
              <p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                <span>
                  {date(p.date)} · {t(`methods.${p.method}`)}
                </span>
                {/* A cheque lowers the balance at once but is collected only when it clears. */}
                {p.status === 'pending' && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {tStatus('pending')}
                  </span>
                )}
                {/* Returned by the bank: it paid nothing (the amount is owed again). */}
                {p.status === 'bounced' && (
                  <span className="bg-danger-soft text-danger rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {tStatus('bounced')}
                  </span>
                )}
              </p>
              {p.note && <p className="text-body mt-1 text-xs">{p.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
