// component/dashbord/settings/InviteSheet.tsx
'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Copy, Link2, Loader2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogHeading,
  dialogIconTile,
  dialogScrollBody,
  dialogTitle,
  sheetFooterBar,
  sheetHeaderBar,
  sheetPopup,
} from '@/component/dialog-chrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { INVITE_ROLES } from '@/lib/auth/permissions';
import { useInviteMutation } from '@/lib/team/hooks';
import { cn } from '@/lib/utils';
import { inviteSchema, type InviteValues } from '@/lib/validations/invite';
import SettingsSelect from './SettingsSelect';
import { settingsInput, settingsLabel } from './fieldStyles';

const EMPTY: InviteValues = { name: '', email: '', role: 'sales' };

export default function InviteSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('Settings.users.invite');
  const tTeam = useTranslations('Team');
  const tr = useTranslations('Settings.users.roles');
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const invite = useInviteMutation();

  // After a successful invite the sheet shows the link instead of the form.
  const [created, setCreated] = useState<{ name: string; email: string; url: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  // Closing clears the link, so the next open starts with an empty form.
  function handleOpenChange(next: boolean) {
    if (!next) {
      setCreated(null);
      setCopied(false);
    }
    onOpenChange(next);
  }

  const error = (key?: string) =>
    key ? <p className="text-danger mt-1 text-[11px] font-semibold">{t(`errors.${key}`)}</p> : null;

  async function submit(values: InviteValues) {
    try {
      const result = await invite.mutateAsync({ ...values, locale: locale === 'en' ? 'en' : 'ar' });
      const { email } = result.invitation;
      setCreated({ name: values.name, email, url: result.inviteUrl, emailSent: result.emailSent });
      if (result.emailSent) toast.success(tTeam('toasts.invited', { email }));
      else toast.warning(tTeam('toasts.inviteNotEmailed', { email }));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
        setError('email', { message: 'emailTaken' });
      } else {
        toast.error(errorMessage(err));
      }
    }
  }

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
    } catch {
      // Clipboard blocked: the link is still selectable in the field.
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        showCloseButton={false}
        className={cn(sheetPopup, 'sm:max-w-md')}
      >
        <SheetHeader className={sheetHeaderBar()}>
          <span className={dialogIconTile()}>
            {created ? <Link2 className="size-5" /> : <UserPlus className="size-5" />}
          </span>
          <div className={dialogHeading}>
            <SheetTitle className={dialogTitle}>{created ? tTeam('invite.linkTitle') : t('title')}</SheetTitle>
            <SheetDescription className={dialogDescription}>
              {created
                ? tTeam(created.emailSent ? 'invite.emailedHint' : 'invite.linkHint', { name: created.name, email: created.email })
                : tTeam('invite.description')}
            </SheetDescription>
          </div>
          <button type="button" onClick={() => handleOpenChange(false)} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </SheetHeader>

        {created ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={cn(dialogScrollBody, 'px-6 py-5')}>
              <Input
                readOnly
                dir="ltr"
                value={created.url}
                onFocus={(e) => e.currentTarget.select()}
                className={settingsInput}
                aria-label={tTeam('invite.linkTitle')}
              />
            </div>
            <div className={sheetFooterBar}>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className={dialogCancelButton}>
                {tTeam('invite.done')}
              </Button>
              <Button type="button" onClick={copyLink} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? tTeam('invite.copied') : tTeam('invite.copy')}
              </Button>
            </div>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              // The sheet sits inside the settings form in the React tree; keep the submit here.
              e.stopPropagation();
              void handleSubmit(submit)(e);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className={cn(dialogScrollBody, 'space-y-4 px-6 py-5')}>
              <div>
                <label htmlFor="invite-name" className={settingsLabel}>
                  {t('fields.name')}
                </label>
                <Input
                  id="invite-name"
                  dir="auto"
                  aria-invalid={!!errors.name?.message}
                  className={settingsInput}
                  {...register('name')}
                />
                {error(errors.name?.message)}
              </div>

              <div>
                <label htmlFor="invite-email" className={settingsLabel}>
                  {t('fields.email')}
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  dir="ltr"
                  aria-invalid={!!errors.email?.message}
                  className={settingsInput}
                  {...register('email')}
                />
                {error(errors.email?.message)}
              </div>

              <div>
                <label htmlFor="invite-role" className={settingsLabel}>
                  {t('fields.role')}
                </label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <SettingsSelect
                      id="invite-role"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={INVITE_ROLES.map((role) => ({ value: role, label: tr(role) }))}
                    />
                  )}
                />
              </div>
            </div>

            <div className={sheetFooterBar}>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className={dialogCancelButton}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? tTeam('invite.sending') : t('send')}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
