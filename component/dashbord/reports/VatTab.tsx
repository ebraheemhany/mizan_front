// component/dashbord/reports/VatTab.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { useMoney } from '@/lib/money';
import { vatRatesOf, type VatReport } from '@/lib/reports/hooks';
import VatCard from './VatCard';

/** Output VAT is the VAT stored on issued invoices; expenses carry no input VAT yet. */
export default function VatTab({ vat }: { vat: VatReport }) {
  const t = useTranslations('Reports.vatTab');
  const tApi = useTranslations('ReportsApi');
  const format = useFormatter();
  const money = useMoney({ cents: true });

  const row = 'flex items-center justify-between gap-4 py-3 text-xs';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('stats.output')}
          value={money(vat.output)}
          hint={t('stats.outputHint')}
        />
        <StatCard
          label={t('stats.input')}
          value={money(vat.input)}
          hint={t('stats.inputHint')}
        />
        <StatCard
          label={t('stats.due')}
          value={money(vat.due)}
          hint={t('stats.dueHint')}
          tone={vat.due > 0 ? 'danger' : 'brand'}
          hintTone="default"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VatCard vat={vat} />

        <div className="rounded-card border-line bg-surface border p-5 shadow-sm">
          <h2 className="text-ink text-sm font-extrabold">
            {t('details.title')}
          </h2>
          <ul className="divide-line/70 mt-4 divide-y">
            <li className={row}>
              <span className="text-ink-2 font-semibold">
                {t('details.rate')}
              </span>
              <span className="text-ink font-bold tabular-nums">
                {vatRatesOf(vat)
                  .map((rate) =>
                    format.number(rate / 100, { style: 'percent', maximumFractionDigits: 2, numberingSystem: 'latn' }),
                  )
                  .join(' · ')}
              </span>
            </li>
            <li className={row}>
              <span className="text-ink-2 font-semibold">
                {t('details.taxableSales')}
              </span>
              <span className="text-ink font-bold tabular-nums">
                {money(vat.taxableSales)}
              </span>
            </li>
            <li className={row}>
              <span className="text-ink-2 font-semibold">{tApi('exemptSales')}</span>
              <span className="text-ink font-bold tabular-nums">{money(vat.exemptSales)}</span>
            </li>
            <li className={row}>
              <span className="text-ink-2 font-semibold">{tApi('invoicesCount')}</span>
              <span className="text-ink font-bold tabular-nums">
                {format.number(vat.invoicesCount, { numberingSystem: 'latn' })}
              </span>
            </li>
          </ul>
          <p className="text-muted mt-3 text-[11px] leading-5">
            {t('details.note')}
          </p>
        </div>
      </div>
    </div>
  );
}
