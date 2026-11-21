// component/ResetPasswordView.tsx
// The page the "forgot password" email links to: choose a new password, then log in.
'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useResetPasswordMutation, useResetPasswordPreview } from '@/lib/auth/account';
import PasswordField from './PasswordField';

const inputClass =
  'h-12 rounded-btn border-line-strong bg-surface shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

const isDeadLink = (error: unknown) => error instanceof ApiError && error.code === 'INVALID_RESET_TOKEN';

export default function ResetPasswordView({ token }: { token: string }) {
  const t = useTranslations('Auth.reset');
  const errorMessage = useApiErrorMessage();
  const preview = useResetPasswordPreview(token);
  // Set when saving fails because the link stopped working meanwhile.
  const [linkDead, setLinkDead] = useState(false);

  if (preview.isPending) {
    return (
      <p role="status" className="text-muted flex items-center justify-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('loading')}
      </p>
    );
  }

  if (linkDead || isDeadLink(preview.error)) {
    return (
      <div className="space-y-4 py-4 text-center">
        <h1 className="text-ink text-2xl font-extrabold">{t('invalidTitle')}</h1>
        <p className="text-body text-sm leading-7">{t('invalidBody')}</p>
        <Link
          href="/forgot-password"
          className="rounded-btn bg-brand hover:bg-brand/90 inline-flex h-11 items-center px-6 text-sm font-bold text-white"
        >
          {t('newLink')}
        </Link>
      </div>
    );
  }

  if (preview.isError) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-danger text-sm font-semibold">{errorMessage(preview.error)}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => preview.refetch()}
          className="rounded-btn border-line-strong h-10 border text-sm font-bold"
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  return <ResetForm token={token} email={preview.data.email} onLinkDead={() => setLinkDead(true)} />;
}

function ResetForm({ token, email, onLinkDead }: { token: string; email: string; onLinkDead: () => void }) {
  const t = useTranslations('Auth.reset');
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const reset = useResetPasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t('errors.passwordMin')),
          confirmPassword: z.string().min(1, t('errors.confirmRequired')),
        })
        .refine((v) => v.password === v.confirmPassword, {
          path: ['confirmPassword'],
          message: t('errors.passwordMismatch'),
        }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } });
  const password = useWatch({ control, name: 'password' });

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await reset.mutateAsync({ token, password: values.password });
      toast.success(t('success'));
      router.push('/login');
    } catch (error) {
      if (isDeadLink(error)) onLinkDead();
      else setServerError(errorMessage(error));
    }
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
          {/* Lets the browser's password manager save the new password for this account. */}
          <Input id="email" value={email} readOnly dir="ltr" autoComplete="username" className={`${inputClass} bg-canvas`} />
        </div>

        <PasswordField
          id="password"
          label={t('password')}
          error={errors.password?.message}
          registration={register('password')}
          autoComplete="new-password"
          strengthPassword={password}
        />
        <PasswordField
          id="confirmPassword"
          label={t('confirmPassword')}
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword')}
          autoComplete="new-password"
        />

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
        <p className="text-muted text-center text-xs leading-6">{t('signsOut')}</p>
      </form>
    </>
  );
}
