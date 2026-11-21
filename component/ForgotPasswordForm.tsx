// component/ForgotPasswordForm.tsx
// Asks for the account's email and sends a link to choose a new password.
'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, MailCheck } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useForgotPasswordMutation } from '@/lib/auth/account';

const inputClass =
  'h-12 rounded-btn border-line-strong bg-surface shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

export default function ForgotPasswordForm() {
  const t = useTranslations('Auth.forgot');
  const errorMessage = useApiErrorMessage();
  const forgot = useForgotPasswordMutation();
  // The address the link went to (the page then says "check your inbox").
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({ email: z.string().trim().min(1, t('errors.emailRequired')).email(t('errors.emailInvalid')) }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  async function onSubmit({ email }: Values) {
    setServerError(null);
    try {
      await forgot.mutateAsync(email);
      setSentTo(email);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 py-2 text-center">
        <span className="bg-brand-soft text-brand-deep mx-auto flex size-14 items-center justify-center rounded-2xl">
          <MailCheck className="size-7" />
        </span>
        <h1 className="text-ink text-2xl font-extrabold">{t('sentTitle')}</h1>
        <p className="text-body text-sm leading-7">
          {t.rich('sentBody', {
            email: sentTo,
            b: (chunks) => (
              <bdi dir="ltr" className="text-ink inline-block max-w-full font-bold break-all">
                {chunks}
              </bdi>
            ),
          })}
        </p>
        <p className="text-muted text-xs leading-6">{t('sentHint')}</p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/login"
            className="rounded-btn bg-brand hover:bg-brand/90 inline-flex h-11 items-center justify-center px-6 text-sm font-bold text-white"
          >
            {t('backToLogin')}
          </Link>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="text-brand-deep h-10 text-sm font-bold hover:underline"
          >
            {t('tryAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-ink text-3xl leading-tight font-extrabold sm:text-4xl">{t('title')}</h1>
      <p className="text-body mt-3 text-sm leading-7 sm:text-base">{t('subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email" className="text-ink mb-2 text-sm font-bold">
            {t('email')}
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            className={inputClass}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
              {errors.email.message}
            </p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="bg-danger-soft text-danger rounded-btn px-3 py-2.5 text-sm font-semibold">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-btn bg-brand hover:bg-brand/90 h-12 w-full font-bold text-white shadow-sm"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t('submit')}
        </Button>

        <p className="text-muted text-center text-sm">
          {t('remembered')}{' '}
          <Link href="/login" className="text-brand-deep font-bold hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </form>
    </>
  );
}
