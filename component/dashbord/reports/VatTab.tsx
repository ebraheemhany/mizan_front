// component/dashbord/reports/VatTab.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import StatCard from '@/component/StatCard';
import { VAT_RATE, vatSummary } from '@/lib/mock/reports';
import VatCard from './VatCard';
import { useReportMoney } from './useReportMoney';

export default function VatTab() {
  const t = useTranslations('Reports.vatTab');
  const format = useFormatter();
  const money = useReportMoney();

  const due = vatSummary.output - vatSummary.input;
  // المبيعات الخاضعة للضريبة = ضريبة المبيعات ÷ النسبة
  const taxableSales = vatSummary.output / VAT_RATE;

  const row = 'flex items-center justify-between gap-4 py-3 text-xs';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t('stats.output')}
          value={money(vatSummary.output)}
          hint={t('stats.outputHint')}
        />
        <StatCard
          label={t('stats.input')}
          value={money(vatSummary.input)}
          hint={t('stats.inputHint')}
        />
        <StatCard
          label={t('stats.due')}
          value={money(due)}
          hint={t('stats.dueHint')}
          tone={due > 0 ? 'danger' : 'brand'}
          hintTone="default"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VatCard vat={vatSummary} />

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
                {format.number(VAT_RATE, {
                  style: 'percent',
                  maximumFractionDigits: 0,
                  numberingSystem: 'latn',
                })}
              </span>
            </li>
            <li className={row}>
              <span className="text-ink-2 font-semibold">
                {t('details.taxableSales')}
              </span>
              <span className="text-ink font-bold tabular-nums">
                {money(taxableSales)}
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
