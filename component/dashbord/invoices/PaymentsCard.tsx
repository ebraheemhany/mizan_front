// components/invoices/PaymentsCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useDate } from '@/lib/data';
import type { Payment } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';

export default function PaymentsCard({ payments }: { payments: Payment[] }) {
  const t = useTranslations('InvoiceDetail.payments');
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
              <p className="text-brand-deep text-sm font-extrabold tabular-nums">
                {money(p.amount)}
              </p>
              <p className="text-muted mt-0.5 text-xs">
                {date(p.date)} · {t(`methods.${p.method}`)}
              </p>

              <p className="text-muted mt-0.5 text-xs">
                {date(p.date)} · {t(`methods.${p.method}`)}
              </p>
              {p.note && <p className="text-body mt-1 text-xs">{p.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
