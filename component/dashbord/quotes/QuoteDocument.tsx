// components/quotes/QuoteDocument.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useDate } from '@/lib/data';
import type { QuoteDetail } from '@/lib/mock/quote-details';
import { displayStatus, effectiveStatus } from '@/lib/mock/quotes';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

function PartyBlock({
  label,
  name,
  taxNumber,
  location,
}: {
  label: string;
  name: string;
  taxNumber: string;
  location: string;
}) {
  const t = useTranslations('InvoiceDetail');

  return (
    <div>
      <p className="text-muted text-xs font-semibold">{label}</p>
      <p className="text-ink mt-1 text-base font-extrabold">{name}</p>
      <p className="text-muted mt-1 text-xs">
        {t('taxNumber', { number: taxNumber })} · {location}
      </p>
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
      <dd className={cn('text-ink font-bold tabular-nums', valueClass)}>{value}</dd>
    </div>
  );
}

export default function QuoteDocument({ quote }: { quote: QuoteDetail }) {
  const t = useTranslations('InvoiceDetail');
  const tq = useTranslations('Quotes.columns');
  const td = useTranslations('QuoteDetail');
  const money = useMoney();
  const date = useDate();

  const expired = effectiveStatus(quote) === 'expired';
  const expiring = displayStatus(quote) === 'expiringSoon';

  return (
    <section className="rounded-card border-line bg-surface border p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_1fr_auto]">
        <PartyBlock label={t('from')} {...quote.issuer} />
        <PartyBlock label={t('to')} {...quote.client} />

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted text-xs">{t('issueDate')}</dt>
            <dd className="text-ink font-bold">{date(quote.issueDate)}</dd>
          </div>
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted text-xs">{tq('validUntil')}</dt>
            <dd
              className={cn(
                'font-bold',
                expired ? 'text-danger' : expiring ? 'text-amber-700' : 'text-ink',
              )}
            >
              {date(quote.validUntil)}
            </dd>
          </div>
        </dl>
      </div>

      {/* البنود */}
      <div className="border-line mt-8 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-canvas/60">
            <tr>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">{t('columns.item')}</th>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">{t('columns.quantity')}</th>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">{t('columns.price')}</th>
              <th className="text-muted px-4 py-3 text-start text-xs font-bold">{t('columns.total')}</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.id} className="border-line border-t">
                <td className="px-4 py-3">
                  <p className="text-ink font-bold">{line.title}</p>
                  {line.description && <p className="text-muted mt-0.5 text-xs">{line.description}</p>}
                </td>
                <td className="text-body px-4 py-3 tabular-nums">{line.quantity}</td>
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
        <SummaryRow label={t('summary.subtotal')} value={money(quote.subtotal)} />
        <SummaryRow
          label={t('summary.vat', { rate: quote.vatRate })}
          value={money(quote.vat)}
        />
        {quote.rounding !== 0 && (
          <SummaryRow label={t('summary.rounding')} value={money(quote.rounding)} />
        )}

        <div className="border-ink border-t-2 pt-4">
          <SummaryRow
            label={t('summary.total')}
            value={money(quote.total)}
            labelClass="text-ink text-lg font-extrabold"
            valueClass="text-xl font-extrabold"
          />
        </div>
      </dl>

      <div className="text-muted border-line mt-6 space-y-1 border-t pt-4 text-xs leading-6">
        <p>{td('validity', { date: date(quote.validUntil) })}</p>
        <p>
          {t('note')}: {quote.note || td('defaultNote')}
        </p>
      </div>
    </section>
  );
}