// component/dashbord/settings/CompanyCard.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SettingsValues } from '@/lib/validations/settings';
import { settingsInput, settingsLabel } from './fieldStyles';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function CompanyCard() {
  const t = useTranslations('Settings.company');
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SettingsValues>();

  const name = useWatch({ control, name: 'company.name' });
  const initial = Array.from(name ?? '')[0] ?? '';

  // TODO: رفع الشعار للسيرفر لما نربط الـ API، دلوقتي معاينة محلية بس
  const [logo, setLogo] = useState<string | null>(null);

  // نحرّر رابط المعاينة القديم لما يتغير أو الكارت يتشال
  useEffect(
    () => () => {
      if (logo) URL.revokeObjectURL(logo);
    },
    [logo],
  );

  function onPickLogo(file?: File) {
    if (!file) return;

    const validType = /^image\/(png|svg\+xml)$/.test(file.type);
    if (!validType || file.size > MAX_LOGO_BYTES) {
      toast.error(t('logoInvalid'));
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setLogo(URL.createObjectURL(file));
  }

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  const e = errors.company;

  return (
    <section
      id="settings-company"
      className="rounded-card border-line bg-surface scroll-mt-24 border p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>
      <p className="text-muted mt-0.5 text-[11px]">{t('description')}</p>

      <div className="mt-5 flex items-center gap-4">
        <span
          aria-hidden
          className="bg-brand-soft text-brand-deep flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-extrabold"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-full object-contain" />
          ) : (
            initial
          )}
        </span>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml"
            className="hidden"
            onChange={(ev) => onPickLogo(ev.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="rounded-btn border-line-strong h-9 border text-xs font-bold"
          >
            {t('uploadLogo')}
          </Button>
          <p className="text-muted mt-1.5 text-[11px]">{t('logoHint')}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company-name" className={settingsLabel}>
            {t('fields.name')}
          </label>
          <Input
            id="company-name"
            dir="auto"
            aria-invalid={!!e?.name?.message}
            className={settingsInput}
            {...register('company.name')}
          />
          {error(e?.name?.message)}
        </div>

        <div>
          <label htmlFor="company-tax" className={settingsLabel}>
            {t('fields.taxNumber')}
          </label>
          <Input
            id="company-tax"
            dir="ltr"
            aria-invalid={!!e?.taxNumber?.message}
            inputMode="numeric"
            className={settingsInput}
            {...register('company.taxNumber')}
          />
          {error(e?.taxNumber?.message)}
        </div>

        <div>
          <label htmlFor="company-register" className={settingsLabel}>
            {t('fields.commercialRegister')}
          </label>
          <Input
            id="company-register"
            dir="ltr"
            aria-invalid={!!e?.commercialRegister?.message}
            inputMode="numeric"
            className={settingsInput}
            {...register('company.commercialRegister')}
          />
          {error(e?.commercialRegister?.message)}
        </div>

        <div>
          <label htmlFor="company-phone" className={settingsLabel}>
            {t('fields.phone')}
          </label>
          <Input
            id="company-phone"
            type="tel"
            dir="ltr"
            aria-invalid={!!e?.phone?.message}
            className={settingsInput}
            {...register('company.phone')}
          />
          {error(e?.phone?.message)}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company-address" className={settingsLabel}>
            {t('fields.address')}
          </label>
          <Input
            id="company-address"
            dir="auto"
            className={settingsInput}
            {...register('company.address')}
          />
        </div>
      </div>
    </section>
  );
}
