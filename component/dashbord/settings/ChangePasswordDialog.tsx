// component/dashbord/settings/ChangePasswordDialog.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError, changePassword, type SessionUser } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { useSession } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';
import {
  changePasswordSchema,
  setPasswordSchema,
  type ChangePasswordValues,
} from '@/lib/validations/password';
import PasswordField from '@/component/PasswordField';

type Props = { open: boolean; onClose: () => void };

export function ChangePasswordDialog(props: Props) {
  // An account made with Google sets its first password: no "current password" field.
  const setting = useSession().hasPassword === false;
  return <PasswordDialog key={setting ? 'set' : 'change'} setting={setting} {...props} />;
}

function PasswordDialog({ open, onClose, setting }: Props & { setting: boolean }) {
  const t = useTranslations('Settings.security.password');
  const errorMessage = useApiErrorMessage();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(setting ? setPasswordSchema : changePasswordSchema),
    defaultValues: { current: '', next: '', confirm: '' },
  });
  const nextPassword = watch('next');

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      // Logs out every other device; this one gets new tokens and stays in.
      await changePassword({ ...(setting ? {} : { currentPassword: values.current }), newPassword: values.next });
      if (setting) {
        queryClient.setQueryData<SessionUser | null>(queryKeys.session, (user) => user && { ...user, hasPassword: true });
      }
      toast.success(t(setting ? 'setSuccess' : 'success'));
      close();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_CURRENT_PASSWORD') {
        setError('current', { message: 'currentWrong' });
      } else {
        toast.error(errorMessage(error));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent
        showCloseButton={false}
        className="border-line bg-surface rounded-card max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto border p-6 shadow-xl sm:max-w-md"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t('close')}
          className="text-muted hover:bg-neutral-soft hover:text-ink focus-visible:ring-brand absolute end-4 top-4 rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <DialogHeader className="pe-8 text-start">
          <span className="bg-brand-soft text-brand mb-1 flex size-11 items-center justify-center rounded-2xl">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-ink text-lg font-extrabold">
            {t(setting ? 'setTitle' : 'title')}
          </DialogTitle>
          <DialogDescription className="text-muted text-sm leading-6">
            {t(setting ? 'setDescription' : 'description')}
          </DialogDescription>
        </DialogHeader>

        {/* الفورم ده ممكن يتحط جوه فورم الإعدادات في شجرة React، فلازم stopPropagation */}
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
          noValidate
        >
          {!setting && (
            <PasswordField
              id="current-password"
              label={t('current')}
              error={
                errors.current?.message
                  ? t(`errors.${errors.current.message}`)
                  : undefined
              }
              registration={register('current')}
              autoComplete="current-password"
            />
          )}
          <PasswordField
            id="new-password"
            label={t('next')}
            error={
              errors.next?.message
                ? t(`errors.${errors.next.message}`)
                : undefined
            }
            registration={register('next')}
            strengthPassword={nextPassword}
          />
          <PasswordField
            id="confirm-password"
            label={t('confirm')}
            error={
              errors.confirm?.message
                ? t(`errors.${errors.confirm.message}`)
                : undefined
            }
            registration={register('confirm')}
          />

          <div className="border-line flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="border-line-strong h-10 text-xs font-bold"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand hover:bg-brand-deep h-10 text-xs font-bold text-white"
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
