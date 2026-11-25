// component/dashbord/settings/TaxesCard.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';

import type { SettingsValues } from '@/lib/validations/settings';
import SwitchField from './SwitchField';
import SettingsSelect from './SettingsSelect';
import { settingsLabel } from './fieldStyles';

const CURRENCIES = ['EGP', 'USD', 'SAR', 'AED'] as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function TaxesCard() {
  const t = useTranslations('Settings.taxes');
  const format = useFormatter();
  const { control } = useFormContext<SettingsValues>();

  return (
    <section
      id="settings-taxes"
      className="rounded-card border-line bg-surface scroll-mt-24 border p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <div className="mt-5 space-y-5">
        <SwitchField
          name="taxes.vatEnabled"
          label={t('vat')}
          hint={t('vatHint')}
        />
        <SwitchField
          name="taxes.withholdingEnabled"
          label={t('withholding')}
          hint={t('withholdingHint')}
        />

        <div>
          <label htmlFor="tax-currency" className={settingsLabel}>
            {t('currency')}
          </label>
          <Controller
            control={control}
            name="taxes.currency"
            render={({ field }) => (
              <SettingsSelect
                id="tax-currency"
                value={field.value}
                onValueChange={field.onChange}
                options={CURRENCIES.map((currency) => ({
                  value: currency,
                  label: t(`currencies.${currency}`),
                }))}
              />
            )}
          />
          <p className="text-muted mt-1.5 text-[11px] leading-5">{t('currencyHint')}</p>
        </div>

        <div>
          <label htmlFor="tax-fiscal" className={settingsLabel}>
            {t('fiscalStart')}
          </label>
          <Controller
            control={control}
            name="taxes.fiscalStartMonth"
            render={({ field }) => (
              <SettingsSelect
                id="tax-fiscal"
                value={field.value}
                onValueChange={field.onChange}
                options={MONTHS.map((month) => ({
                  value: String(month),
                  label: t('fiscalStartOption', {
                    day: format.number(1, { numberingSystem: 'latn' }),
                    month: format.dateTime(
                      new Date(Date.UTC(2026, month - 1, 1)),
                      {
                        month: 'long',
                        timeZone: 'UTC',
                      },
                    ),
                  }),
                }))}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
