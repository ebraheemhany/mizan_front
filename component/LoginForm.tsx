// src/components/auth/LoginForm.tsx
'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { safeNextPath } from '@/lib/auth/constants';
import { useLoginMutation } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  createLoginSchema,
  type LoginValues,
} from '@/lib/validations/loginForm';

export default function LoginForm() {
  const t = useTranslations('Auth.login');
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const errorMessage = useApiErrorMessage();
  const [showPassword, setShowPassword] = useState(false);
  // Errors from the server (wrong password, too many attempts...) shown above the button.
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      createLoginSchema({
        emailRequired: t('errors.emailRequired'),
        emailInvalid: t('errors.emailInvalid'),
        passwordRequired: t('errors.passwordRequired'),
        passwordMin: t('errors.passwordMin'),
      }),
    [t],
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      await loginMutation.mutateAsync(values);
      // Back to the page that sent us here (proxy.ts adds ?next=), else the dashboard.
      // Read at submit time, not with useSearchParams, so the page can still prerender.
      const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
      router.replace(next ?? '/dashboard');
    } catch (error) {
      setServerError(errorMessage(error));
    }
  }

  const inputClass =
    'h-12 rounded-btn border-line-strong bg-surface shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8" noValidate>
      <FieldGroup className="gap-5">
        {/* Email */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                htmlFor="email"
                className="text-ink text-sm font-bold"
              >
                {t('email')}
              </FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                aria-invalid={fieldState.invalid}
                className={inputClass}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Password */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                htmlFor="password"
                className="text-ink text-sm font-bold"
              >
                {t('password')}
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  className={`${inputClass} pe-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? t('hidePassword') : t('showPassword')
                  }
                  className="text-muted hover:text-ink absolute inset-e-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between gap-3">
          <Controller
            name="remember"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal" className="w-auto">
                <Checkbox
                  id="remember"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <FieldLabel
                  htmlFor="remember"
                  className="text-body cursor-pointer text-sm font-normal"
                >
                  {t('remember')}
                </FieldLabel>
              </Field>
            )}
          />
          <Link
            href="/forgot-password"
            className="text-brand w-full text-right text-sm hover:underline"
          >
            {t('forgot')}
          </Link>
        </div>

        {serverError && (
          <p
            role="alert"
            className="bg-danger-soft text-danger rounded-btn px-3 py-2.5 text-sm font-semibold"
          >
            {serverError}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-1">
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
        </div>

        <p className="text-muted pt-2 text-center text-sm">
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="text-brand font-bold hover:underline"
          >
            {t('register')}
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
