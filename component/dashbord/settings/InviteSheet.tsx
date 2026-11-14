// component/dashbord/settings/InviteSheet.tsx
'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { INVITE_ROLES, type Member } from '@/lib/mock/settings';
import { inviteSchema, type InviteValues } from '@/lib/validations/invite';
import SettingsSelect from './SettingsSelect';
import { settingsInput, settingsLabel } from './fieldStyles';

const EMPTY: InviteValues = { name: '', email: '', role: 'sales' };

export default function InviteSheet({
  open,
  members,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  members: Member[];
  onOpenChange: (open: boolean) => void;
  onInvite: (values: InviteValues) => void;
}) {
  const t = useTranslations('Settings.users.invite');
  const tr = useTranslations('Settings.users.roles');
  const locale = useLocale();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  function submit(values: InviteValues) {
    const taken = members.some(
      (m) => m.email.toLowerCase() === values.email.toLowerCase(),
    );
    if (taken) {
      setError('email', { message: 'emailTaken' });
      return;
    }
    onInvite(values);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-ink text-base font-extrabold">
            {t('title')}
          </SheetTitle>
          <SheetDescription className="text-muted text-xs">
            {t('description')}
          </SheetDescription>
        </SheetHeader>

        <form
          noValidate
          onSubmit={(e) => {
            // الدرج جوه فورم الإعدادات في شجرة React، فنمنع الـ submit يوصل له
            e.stopPropagation();
            void handleSubmit(submit)(e);
          }}
          className="space-y-4 px-4 pb-6"
        >
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
                  options={INVITE_ROLES.map((role) => ({
                    value: role,
                    label: tr(role),
                  }))}
                />
              )}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-btn bg-brand hover:bg-brand/90 h-10 flex-1 text-xs font-bold text-white"
            >
              {t('send')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-btn border-line-strong h-10 border text-xs font-bold"
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
