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
  DialogFooter,
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
import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogFooterBar,
  dialogHeaderBar,
  dialogHeading,
  dialogIconTile,
  dialogPopup,
  dialogTitle,
} from '@/component/dialog-chrome';
import PasswordField from '@/component/PasswordField';
import { cn } from '@/lib/utils';

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
      <DialogContent showCloseButton={false} className={cn(dialogPopup, 'sm:max-w-md')}>
        <div className={dialogHeaderBar()}>
          <span className={dialogIconTile()}>
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <DialogHeader className={dialogHeading}>
            <DialogTitle className={dialogTitle}>{t(setting ? 'setTitle' : 'title')}</DialogTitle>
            <DialogDescription className={dialogDescription}>
              {t(setting ? 'setDescription' : 'description')}
            </DialogDescription>
          </DialogHeader>
          <button type="button" onClick={close} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* الفورم ده ممكن يتحط جوه فورم الإعدادات في شجرة React، فلازم stopPropagation */}
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }}
          noValidate
        >
          <div className="space-y-4 px-6 py-5">
            {!setting && (
              <PasswordField
                id="current-password"
                label={t('current')}
                error={errors.current?.message ? t(`errors.${errors.current.message}`) : undefined}
                registration={register('current')}
                autoComplete="current-password"
              />
            )}
            <PasswordField
              id="new-password"
              label={t('next')}
              error={errors.next?.message ? t(`errors.${errors.next.message}`) : undefined}
              registration={register('next')}
              strengthPassword={nextPassword}
            />
            <PasswordField
              id="confirm-password"
              label={t('confirm')}
              error={errors.confirm?.message ? t(`errors.${errors.confirm.message}`) : undefined}
              registration={register('confirm')}
            />
          </div>

          <DialogFooter className={dialogFooterBar}>
            <Button type="button" variant="outline" onClick={close} className={dialogCancelButton}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
