// component/dashbord/reports/VatCard.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { VatSummary } from '@/lib/mock/reports';
import { useReportMoney } from './useReportMoney';

export default function VatCard({ vat }: { vat: VatSummary }) {
  const t = useTranslations('Reports.vat');
  const format = useFormatter();
  const money = useReportMoney();

  const due = vat.output - vat.input;

  const row = 'flex items-center justify-between gap-4 py-3 text-xs';

  return (
    <div className="rounded-card border-line bg-surface flex flex-col border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <ul className="divide-line/70 mt-4 divide-y">
        <li className={row}>
          <span className="text-ink-2 font-semibold">{t('output')}</span>
          <span className="text-ink font-bold tabular-nums">
            {money(vat.output)}
          </span>
        </li>
        <li className={row}>
          <span className="text-ink-2 font-semibold">{t('input')}</span>
          <span className="text-ink font-bold tabular-nums">
            {money(vat.input)}
          </span>
        </li>
        <li className={row}>
          <span className="text-ink font-extrabold">{t('due')}</span>
          <span className="text-danger font-extrabold tabular-nums">
            {money(due)}
          </span>
        </li>
        <li className={row}>
          <span className="text-ink-2 font-semibold">{t('dueDate')}</span>
          <span className="text-ink font-bold tabular-nums">
            {format.dateTime(new Date(vat.dueDate), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
              numberingSystem: 'latn',
            })}
          </span>
        </li>
      </ul>

      <p className="text-muted mt-3 text-[11px] leading-5">{t('note')}</p>
    </div>
  );
}
