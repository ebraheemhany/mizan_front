// components/invoices/InvoiceDocument.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useDate } from '@/lib/data';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

function PartyBlock({
  label,
  name,
  taxNumber,
  location,
  logoUrl,
}: {
  label: string;
  name: string;
  taxNumber: string;
  location: string;
  logoUrl?: string;
}) {
  const t = useTranslations('InvoiceDetail');
  // Only what is there (no empty "Tax number:" when there's none).
  const details = [taxNumber && t('taxNumber', { number: taxNumber }), location].filter(Boolean);

  return (
    <div>
      {logoUrl && (
        // A plain img: the logo comes from the API's origin and prints as is.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="mb-3 h-12 max-w-40 object-contain" />
      )}
      <p className="text-muted text-xs font-semibold">{label}</p>
      <p className="text-ink mt-1 text-base font-extrabold">{name}</p>
      {details.length > 0 && <p className="text-muted mt-1 text-xs">{details.join(' · ')}</p>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  labelClass,
  valueClass,
}: {
  label: string;
  value: string;
  labelClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn('text-body', labelClass)}>{label}</dt>
      <dd className={cn('text-ink font-bold tabular-nums', valueClass)}>
        {value}
      </dd>
    </div>
  );
}

export default function InvoiceDocument({
  invoice,
  className,
}: {
  invoice: InvoiceDetail;
  className?: string;
}) {
  const t = useTranslations('InvoiceDetail');
  const money = useMoney();
  const date = useDate();

  const overdue = invoice.status === 'overdue';

  return (
    <section
      className={cn(
        'rounded-card border-line bg-surface border p-6 shadow-sm sm:p-8',
        className,
      )}
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_1fr_auto]">
        <PartyBlock label={t('from')} {...invoice.issuer} />
        <PartyBlock label={t('to')} {...invoice.client} />

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted text-xs">{t('issueDate')}</dt>
            <dd className="text-ink font-bold">{date(invoice.issueDate)}</dd>
          </div>
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted text-xs">{t('dueDate')}</dt>
            <dd
              className={cn('font-bold', overdue ? 'text-danger' : 'text-ink')}
            >
              {date(invoice.dueDate)}
            </dd>
          </div>
        </dl>
      </div>

      {/* البنود */}
      <div className="border-line mt-8 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-canvas/60">
            <tr>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">
                {t('columns.item')}
              </th>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">
                {t('columns.quantity')}
              </th>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">
                {t('columns.price')}
              </th>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">
                {t('columns.total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-line border-t">
                <td className="px-4 py-3">
                  <p className="text-ink font-bold">{line.title}</p>
                  {line.description && (
                    <p className="text-muted mt-0.5 text-xs">
                      {line.description}
                    </p>
                  )}
                </td>
                <td className="text-body px-4 py-3 tabular-nums">
                  {line.quantity}
                </td>
                <td className="text-body px-4 py-3 whitespace-nowrap tabular-nums">
                  {money(line.unitPrice)}
                </td>
                <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">
                  {money(line.quantity * line.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* الإجماليات */}
      <dl className="mt-6 space-y-3 text-sm">
        <SummaryRow
          label={t('summary.subtotal')}
          value={money(invoice.subtotal)}
        />
        <SummaryRow
          label={t('summary.vat', { rate: invoice.vatRate })}
          value={money(invoice.vat)}
        />
        <SummaryRow
          label={t('summary.rounding')}
          value={money(invoice.rounding)}
        />

        <div className="border-ink border-t-2 pt-4">
          <SummaryRow
            label={t('summary.total')}
            value={money(invoice.total)}
            labelClass="text-ink text-lg font-extrabold"
            valueClass="text-xl font-extrabold"
          />
        </div>

        <SummaryRow
          label={t('summary.remaining')}
          value={money(invoice.remaining)}
          labelClass="font-bold"
          valueClass={
            invoice.remaining === 0
              ? 'text-muted'
              : overdue
                ? 'text-danger'
                : 'text-ink'
          }
        />
      </dl>

      {invoice.note && (
        <p className="text-muted border-line mt-6 border-t pt-4 text-xs leading-6">
          {t('note')}: {invoice.note}
        </p>
      )}
    </section>
  );
}
