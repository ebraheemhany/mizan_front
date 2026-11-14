// component/dashbord/settings/NumberingCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import type { SettingsValues } from '@/lib/validations/settings';
import SettingsSelect from './SettingsSelect';
import { settingsInput, settingsLabel } from './fieldStyles';

const TERMS = ['0', '15', '30', '45', '60'] as const;

export default function NumberingCard() {
  const t = useTranslations('Settings.numbering');
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SettingsValues>();

  const invoicePrefix = useWatch({ control, name: 'numbering.invoicePrefix' });
  const invoiceNext = useWatch({ control, name: 'numbering.invoiceNext' });

  const e = errors.numbering;

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  return (
    <section
      id="settings-numbering"
      className="rounded-card border-line bg-surface scroll-mt-24 border p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="num-inv-prefix" className={settingsLabel}>
            {t('invoicePrefix')}
          </label>
          <Input
            id="num-inv-prefix"
            dir="ltr"
            aria-invalid={!!e?.invoicePrefix?.message}
            className={settingsInput}
            {...register('numbering.invoicePrefix')}
          />
          {error(e?.invoicePrefix?.message)}
        </div>
        <div>
          <label htmlFor="num-inv-next" className={settingsLabel}>
            {t('invoiceNext')}
          </label>
          <Input
            id="num-inv-next"
            dir="ltr"
            aria-invalid={!!e?.invoiceNext?.message}
            inputMode="numeric"
            className={settingsInput}
            {...register('numbering.invoiceNext')}
          />
          {error(e?.invoiceNext?.message)}
        </div>

        <div>
          <label htmlFor="num-quote-prefix" className={settingsLabel}>
            {t('quotePrefix')}
          </label>
          <Input
            id="num-quote-prefix"
            dir="ltr"
            aria-invalid={!!e?.quotePrefix?.message}
            className={settingsInput}
            {...register('numbering.quotePrefix')}
          />
          {error(e?.quotePrefix?.message)}
        </div>
        <div>
          <label htmlFor="num-quote-next" className={settingsLabel}>
            {t('quoteNext')}
          </label>
          <Input
            id="num-quote-next"
            dir="ltr"
            aria-invalid={!!e?.quoteNext?.message}
            inputMode="numeric"
            className={settingsInput}
            {...register('numbering.quoteNext')}
          />
          {error(e?.quoteNext?.message)}
        </div>

        <div className="col-span-2">
          <label htmlFor="num-terms" className={settingsLabel}>
            {t('paymentTerms')}
          </label>
          <Controller
            control={control}
            name="numbering.paymentTermsDays"
            render={({ field }) => (
              <SettingsSelect
                id="num-terms"
                value={field.value}
                onValueChange={field.onChange}
                options={TERMS.map((days) => ({
                  value: days,
                  label: t(`terms.d${days}`),
                }))}
              />
            )}
          />
        </div>
      </div>

      {/* TODO: الترقيم الفعلي بيتحدّد من الباك إند لما نربط الـ API */}
      <p className="text-muted mt-4 text-[11px]" dir="auto">
        {t('preview', { value: `${invoicePrefix}${invoiceNext}` })}
      </p>
    </section>
  );
}
