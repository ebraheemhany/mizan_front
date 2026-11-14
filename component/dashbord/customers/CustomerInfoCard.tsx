// components/customers/CustomerInfoCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { CustomerDetail } from '@/lib/mock/customer-details';

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-muted text-xs font-semibold">{label}</dt>
      <dd className="text-ink mt-1 text-sm font-bold break-words">
        {children || <span className="text-muted font-normal">—</span>}
      </dd>
    </div>
  );
}

export default function CustomerInfoCard({
  detail,
}: {
  detail: CustomerDetail;
}) {
  const t = useTranslations('CustomerDetail');
  const { customer, ownerName } = detail;

  return (
    <>
      <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
        <h2 className="text-ink text-base font-extrabold">{t('info.title')}</h2>

        <dl className="divide-line mt-4 divide-y">
          <Row label={t('info.contact')}>{customer.contact}</Row>

          <Row label={t('info.phone')}>
            {customer.phone && (
              <a
                href={`tel:${customer.phone.replace(/\s/g, '')}`}
                dir="ltr"
                className="text-brand inline-block tabular-nums hover:underline"
              >
                {customer.phone}
              </a>
            )}
          </Row>

          <Row label={t('info.email')}>
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                dir="ltr"
                className="text-brand inline-block hover:underline"
              >
                {customer.email}
              </a>
            )}
          </Row>

          <Row label={t('info.city')}>{customer.city}</Row>

          <Row label={t('info.taxNumber')}>
            {customer.taxNumber && (
              <span dir="ltr" className="inline-block tabular-nums">
                {customer.taxNumber}
              </span>
            )}
          </Row>

          <Row label={t('info.owner')}>{ownerName}</Row>
        </dl>
      </section>

      {customer.notes && (
        <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
          <h2 className="text-ink text-base font-extrabold">
            {t('notes.title')}
          </h2>
          <p className="text-body mt-3 text-sm leading-7 whitespace-pre-line">
            {customer.notes}
          </p>
        </section>
      )}
    </>
  );
}
