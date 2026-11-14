// component/dashbord/settings/TemplateCard.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type { SettingsValues } from '@/lib/validations/settings';
import { settingsLabel, settingsTextarea } from './fieldStyles';

const STYLES = ['classic', 'modern', 'minimal'] as const;
type Style = (typeof STYLES)[number];

const PREVIEW: Record<Style, string> = {
  classic: 'bg-neutral-soft',
  modern: 'bg-brand-soft',
  minimal: 'bg-neutral-soft',
};

const MAX_FOOTER = 200;

export default function TemplateCard() {
  const t = useTranslations('Settings.template');
  const format = useFormatter();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SettingsValues>();

  const footer = useWatch({ control, name: 'template.footer' }) ?? '';

  return (
    <section
      id="settings-template"
      className="rounded-card border-line bg-surface scroll-mt-24 border p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>
      <p className="text-muted mt-0.5 text-[11px]">{t('description')}</p>

      <Controller
        control={control}
        name="template.style"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={t('title')}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {STYLES.map((style) => {
              const selected = field.value === style;
              return (
                <button
                  key={style}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => field.onChange(style)}
                  onKeyDown={(e) => {
                    const dir =
                      e.key === 'ArrowRight' || e.key === 'ArrowDown'
                        ? 1
                        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                          ? -1
                          : 0;
                    if (!dir) return;
                    e.preventDefault();
                    const next =
                      STYLES[
                        (STYLES.indexOf(style) + dir + STYLES.length) %
                          STYLES.length
                      ];
                    field.onChange(next);
                    (
                      e.currentTarget.parentElement?.querySelector(
                        `[data-style="${next}"]`,
                      ) as HTMLElement | null
                    )?.focus();
                  }}
                  data-style={style}
                  className={cn(
                    'rounded-card focus-visible:ring-brand/30 border p-3 text-start transition-colors outline-none focus-visible:ring-2',
                    selected
                      ? 'border-brand bg-surface border-2'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <div
                    className={cn(
                      'h-24 rounded-lg p-3',
                      PREVIEW[style],
                    )}
                    aria-hidden
                  >
                    <div className="bg-surface/70 h-2 w-1/3 rounded" />
                    <div className="bg-surface/70 mt-2 h-2 w-2/3 rounded" />
                    <div className="bg-surface/70 mt-6 h-2 w-1/2 rounded" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-ink text-xs font-extrabold">
                      {t(`styles.${style}`)}
                    </span>
                    {selected && (
                      <span className="bg-brand-soft text-brand-deep inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold">
                        <span className="bg-brand size-1.5 rounded-full" />
                        {t('active')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      />

      <div className="mt-5">
        <label htmlFor="template-footer" className={settingsLabel}>
          {t('footer')}
        </label>
        <textarea
          id="template-footer"
          rows={3}
          dir="auto"
          aria-invalid={!!errors.template?.footer?.message}
          className={settingsTextarea}
          {...register('template.footer')}
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-danger text-[11px] font-semibold">
            {errors.template?.footer?.message
              ? t(`errors.${errors.template.footer.message}`)
              : ''}
          </p>
          <p className="text-muted text-[11px] tabular-nums">
            {format.number(footer.length, { numberingSystem: 'latn' })} /{' '}
            {format.number(MAX_FOOTER, { numberingSystem: 'latn' })}
          </p>
        </div>
      </div>
      {/* TODO: القالب والتذييل يتطبقوا على الفاتورة العامة والـ PDF لما نربط الصفحات */}
    </section>
  );
}