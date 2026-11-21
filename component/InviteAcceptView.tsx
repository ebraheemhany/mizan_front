// component/InviteAcceptView.tsx
// The page an invited person opens from their link: shows the company and role,
// lets them pick a password, then sends them to log in.
'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useMailLocale } from '@/lib/auth/account';
import { useAcceptInvitationMutation, useInvitationPreview, type InvitationPreview } from '@/lib/team/hooks';
import PasswordField from './PasswordField';

const inputClass =
  'h-12 rounded-btn border-line-strong bg-surface shadow-sm transition focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10';

export default function InviteAcceptView({ token }: { token: string }) {
  const t = useTranslations('InvitePage');
  const tTeam = useTranslations('Team');
  const errorMessage = useApiErrorMessage();
  const preview = useInvitationPreview(token);
  // Set when accepting fails because the link stopped working in the meantime.
  const [linkDead, setLinkDead] = useState(false);

  if (preview.isPending) {
    return (
      <p role="status" className="text-muted flex items-center justify-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('loading')}
      </p>
    );
  }

  const invalid =
    linkDead || (preview.error instanceof ApiError && preview.error.code === 'INVALID_INVITATION');

  if (invalid) {
    return (
      <div className="space-y-4 py-4 text-center">
        <h1 className="text-ink text-2xl font-extrabold">{t('invalidTitle')}</h1>
        <p className="text-body text-sm leading-7">{t('invalidBody')}</p>
        <Link
          href="/login"
          className="rounded-btn bg-brand hover:bg-brand/90 inline-flex h-11 items-center px-6 text-sm font-bold text-white"
        >
          {t('goLogin')}
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
          {tTeam('retry')}
        </Button>
      </div>
    );
  }

  return <AcceptForm token={token} invitation={preview.data} onLinkDead={() => setLinkDead(true)} />;
}

function AcceptForm({
  token,
  invitation,
  onLinkDead,
}: {
  token: string;
  invitation: InvitationPreview;
  onLinkDead: () => void;
}) {
  const t = useTranslations('InvitePage');
  const tRoles = useTranslations('Settings.users.roles');
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const accept = useAcceptInvitationMutation();
  const locale = useMailLocale();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().trim().min(3, t('errors.fullNameMin')),
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: invitation.name, password: '', confirmPassword: '' },
  });
  const password = watch('password');

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await accept.mutateAsync({ token, password: values.password, fullName: values.fullName, locale });
      toast.success(t('success'));
      router.push('/login');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_INVITATION') {
        onLinkDead();
      } else {
        setServerError(errorMessage(error));
      }
    }
  }

  return (
    <>
      <h1 className="text-ink text-3xl leading-tight font-extrabold sm:text-4xl">
        {t('title', { company: invitation.company.name })}
      </h1>
      <p className="text-body mt-3 text-sm leading-7 sm:text-base">
        {t('subtitle', { role: tRoles(invitation.role) })}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email" className="text-ink mb-2 text-sm font-bold">
            {t('email')}
          </Label>
          <Input id="email" value={invitation.email} readOnly dir="ltr" className={`${inputClass} bg-canvas`} />
        </div>

        <div>
          <Label htmlFor="fullName" className="text-ink mb-2 text-sm font-bold">
            {t('fullName')}
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            className={inputClass}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
              {errors.fullName.message}
            </p>
          )}
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
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>
    </>
  );
}
