// components/auth/RegisterForm.tsx
'use client';

import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createRegisterSchema,
  type RegisterValues,
} from '@/lib/validations/loginForm';
import PasswordField from './PasswordField';

const inputClass =
  'h-12 rounded-btn border-line-strong bg-surface shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
      {message}
    </p>
  );
}

export default function RegisterForm() {
  const t = useTranslations('Auth.register');

  const schema = useMemo(
    () =>
      createRegisterSchema({
        fullNameRequired: t('errors.fullNameRequired'),
        fullNameMin: t('errors.fullNameMin'),
        companyRequired: t('errors.companyRequired'),
        emailRequired: t('errors.emailRequired'),
        emailInvalid: t('errors.emailInvalid'),
        passwordRequired: t('errors.passwordRequired'),
        passwordMin: t('errors.passwordMin'),
        confirmRequired: t('errors.confirmRequired'),
        passwordMismatch: t('errors.passwordMismatch'),
        termsRequired: t('errors.termsRequired'),
      }),
    [t],
  );

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const password = watch('password');

  async function onSubmit(values: RegisterValues) {
    // TODO: استبدل ده بطلب إنشاء الحساب الحقيقي
    await new Promise((r) => setTimeout(r, 800));
    console.log(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
      {/* الاسم + الشركة */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName" className="text-ink mb-2 text-sm font-bold">
            {t('fullName')}
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder={t('fullNamePlaceholder')}
            aria-invalid={!!errors.fullName}
            className={inputClass}
            {...register('fullName')}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

        <div>
          <Label htmlFor="companyName" className="text-ink mb-2 text-sm font-bold">
            {t('companyName')}
          </Label>
          <Input
            id="companyName"
            autoComplete="organization"
            placeholder={t('companyPlaceholder')}
            aria-invalid={!!errors.companyName}
            className={inputClass}
            {...register('companyName')}
          />
          <FieldError message={errors.companyName?.message} />
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="text-ink mb-2 text-sm font-bold">
          {t('email')}
        </Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          aria-invalid={!!errors.email}
          className={inputClass}
          {...register('email')}
        />
        <FieldError message={errors.email?.message} />
      </div>

      {/* Password + strength */}
      <PasswordField
        id="password"
        label={t('password')}
        error={errors.password?.message}
        registration={register('password')}
        strengthPassword={password}
      />

      {/* Confirm */}
      <PasswordField
        id="confirmPassword"
        label={t('confirmPassword')}
        error={errors.confirmPassword?.message}
        registration={register('confirmPassword')}
      />

      {/* Terms */}
      <div>
        <div className="flex items-center gap-2">
          <Controller
            name="terms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="terms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={!!errors.terms}
              />
            )}
          />
          <Label htmlFor="terms" className="text-body block text-sm leading-6 font-normal">
            {t.rich('terms', {
              terms: (chunks) => (
                <Link href="/terms" className="text-brand font-bold hover:underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="text-brand font-bold hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </Label>
        </div>
        <FieldError message={errors.terms?.message} />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="rounded-btn bg-brand hover:bg-brand/90 h-12 w-full font-bold text-white shadow-sm transition hover:-translate-y-0.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </Button>

      <p className="text-muted text-center text-sm">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-brand font-bold hover:underline">
          {t('login')}
        </Link>
      </p>
    </form>
  );
}