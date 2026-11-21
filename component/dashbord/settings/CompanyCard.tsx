// component/dashbord/settings/CompanyCard.tsx
'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { publicLogoUrl } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { logoProblem, useRemoveLogo, useSetLogo, useSettings } from '@/lib/settings/hooks';
import type { SettingsValues } from '@/lib/validations/settings';
import { settingsInput, settingsLabel } from './fieldStyles';

export default function CompanyCard() {
  const t = useTranslations('Settings.company');
  const errorMessage = useApiErrorMessage();
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SettingsValues>();

  const name = useWatch({ control, name: 'company.name' });
  const initial = Array.from(name ?? '')[0] ?? '';

  // The logo is saved as soon as it is picked (it isn't part of the form's Save).
  const logoId = useSettings().data?.company.logoId ?? null;
  const logo = logoId ? publicLogoUrl(logoId) : null;
  const setLogo = useSetLogo();
  const removeLogo = useRemoveLogo();
  const busy = setLogo.isPending || removeLogo.isPending;

  function onPickLogo(file?: File) {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (logoProblem(file)) {
      toast.error(t('logoInvalid'));
      return;
    }
    setLogo.mutate(file, {
      onSuccess: () => toast.success(t('logoSaved')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  function onRemoveLogo() {
    removeLogo.mutate(undefined, {
      onSuccess: () => toast.success(t('logoRemoved')),
      onError: (error) => toast.error(errorMessage(error)),
    });
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
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(ev) => onPickLogo(ev.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="rounded-btn border-line-strong h-9 border text-xs font-bold"
            >
              {setLogo.isPending && <Loader2 className="size-3.5 animate-spin" />}
              {logo ? t('changeLogo') : t('uploadLogo')}
            </Button>
            {logo && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={onRemoveLogo}
                className="rounded-btn text-danger hover:bg-danger-soft hover:text-danger h-9 text-xs font-bold"
              >
                {removeLogo.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {t('removeLogo')}
              </Button>
            )}
          </div>
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
