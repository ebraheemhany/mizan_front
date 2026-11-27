// components/customers/AddCustomerSheet.tsx
'use client';

import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Pencil, UserPlus, X } from 'lucide-react';
import { FieldError } from '@/component/form-parts';
import {
  dialogClose,
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
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { rtlLocales } from '@/i18n/routing';
import type { Owner } from '@/lib/mock/customers';
import { cn } from '@/lib/utils';
import OwnerPicker, { useOwnerInvite } from '@/component/dashbord/team/OwnerPicker';
import {
  createCustomerSchema,
  type CustomerFormValues,
} from '@/lib/validations/customer';

const fieldClass =
  'rounded-btn border-line-strong bg-surface text-ink placeholder:text-muted hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
const labelClass = 'text-ink mb-2 text-sm font-bold';

type Mode = 'create' | 'edit';

const emptyValues = (ownerId: string): CustomerFormValues => ({
  name: '',
  contact: '',
  phone: '',
  email: '',
  city: '',
  ownerId,
  taxNumber: '',
  notes: '',
});

function CustomerForm({
  mode,
  initial,
  owners,
  defaultOwnerId,
  onSubmit,
  onCancel,
}: {
  mode: Mode;
  initial?: CustomerFormValues;
  owners: Owner[];
  defaultOwnerId: string;
  onSubmit: (values: CustomerFormValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations('Customers.addSheet');

  const schema = useMemo(
    () =>
      createCustomerSchema({
        nameRequired: t('errors.nameRequired'),
        nameMax: t('errors.nameMax'),
        phoneInvalid: t('errors.phoneInvalid'),
        emailInvalid: t('errors.emailInvalid'),
        notesMax: t('errors.notesMax'),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? emptyValues(defaultOwnerId),
  });
  // Someone new can be invited onto the team from the owner picker.
  const ownerInvite = useOwnerInvite();

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className={cn(dialogScrollBody, 'space-y-5 p-6')}>
          {/* الاسم */}
          <div>
            <Label htmlFor="c-name" className={labelClass}>
              {t('name')}
            </Label>
            <Input
              id="c-name"
              autoFocus
              autoComplete="off"
              placeholder={t('namePlaceholder')}
              aria-invalid={!!errors.name}
              className={fieldClass}
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* مسؤول التواصل + الهاتف */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-contact" className={labelClass}>
                {t('contact')}
              </Label>
              <Input
                id="c-contact"
                autoComplete="off"
                placeholder={t('contactPlaceholder')}
                aria-invalid={!!errors.contact}
                className={fieldClass}
                {...register('contact')}
              />
              <FieldError message={errors.contact?.message} />
            </div>

            <div>
              <Label htmlFor="c-phone" className={labelClass}>
                {t('phone')}
              </Label>
              <Input
                id="c-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoComplete="off"
                placeholder={t('phonePlaceholder')}
                aria-invalid={!!errors.phone}
                className={fieldClass}
                {...register('phone')}
              />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>

          {/* البريد */}
          <div>
            <Label htmlFor="c-email" className={labelClass}>
              {t('email')}
            </Label>
            <Input
              id="c-email"
              type="email"
              inputMode="email"
              dir="ltr"
              autoComplete="off"
              placeholder={t('emailPlaceholder')}
              aria-invalid={!!errors.email}
              className={fieldClass}
              {...register('email')}
            />
            <FieldError message={errors.email?.message} />
          </div>

          {/* المدينة + المسؤول */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-city" className={labelClass}>
                {t('city')}
              </Label>
              <Input
                id="c-city"
                autoComplete="off"
                placeholder={t('cityPlaceholder')}
                aria-invalid={!!errors.city}
                className={fieldClass}
                {...register('city')}
              />
              <FieldError message={errors.city?.message} />
            </div>

            <div>
              <Label htmlFor="c-owner" className={labelClass}>
                {t('owner')}
              </Label>
              {/* اختيار من المسؤولين الموجودين بدل نص حر، علشان الفلتر والتصدير يلاقوا الاسم */}
              <Controller
                control={control}
                name="ownerId"
                render={({ field }) => (
                  <OwnerPicker id="c-owner" value={field.value} owners={owners} invite={ownerInvite} onChange={field.onChange} />
                )}
              />
              <FieldError message={errors.ownerId?.message} />
            </div>
          </div>

          {/* الرقم الضريبي */}
          <div>
            <Label htmlFor="c-tax" className={labelClass}>
              {t('taxNumber')}
            </Label>
            <Input
              id="c-tax"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('taxNumberPlaceholder')}
              aria-invalid={!!errors.taxNumber}
              className={fieldClass}
              {...register('taxNumber')}
            />
            <FieldError message={errors.taxNumber?.message} />
          </div>

          {/* ملاحظات */}
          <div>
            <Label htmlFor="c-notes" className={labelClass}>
              {t('notes')}
            </Label>
            <Textarea
              id="c-notes"
              rows={3}
              placeholder={t('notesPlaceholder')}
              aria-invalid={!!errors.notes}
              className="rounded-btn border-line-strong bg-surface hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 resize-none focus-visible:ring-2"
              {...register('notes')}
            />
            <FieldError message={errors.notes?.message} />
          </div>
        </div>

        <div className={sheetFooterBar}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-btn border-line-strong bg-surface h-11 px-6 font-bold"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-btn bg-brand hover:bg-brand/90 h-11 gap-2 px-8 font-bold text-white"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t(mode === 'edit' ? 'saveChanges' : 'submit')}
          </Button>
        </div>
      </form>
      {/* Outside the form: a submit in the invitation must not submit the customer. */}
      {ownerInvite.dialogs}
    </>
  );
}

export default function AddCustomerSheet({
  open,
  onOpenChange,
  onSubmit,
  owners,
  defaultOwnerId,
  mode = 'create',
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** May be async: the save button shows a spinner until it settles. */
  onSubmit: (values: CustomerFormValues) => void | Promise<void>;
  /** Team members to pick "responsible" from. */
  owners: Owner[];
  /** Pre-selected responsible person for a new customer (the current user). */
  defaultOwnerId: string;
  mode?: Mode;
  /** قيم النموذج في وضع التعديل */
  initial?: CustomerFormValues;
}) {
  const t = useTranslations('Customers.addSheet');
  const locale = useLocale();
  const isEdit = mode === 'edit';
  const Icon = isEdit ? Pencil : UserPlus;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        // بيفتح من جهة نهاية الصفحة: شمال في العربي ويمين في الإنجليزي
        side={rtlLocales.includes(locale) ? 'left' : 'right'}
        showCloseButton={false}
        className={cn(sheetPopup, 'sm:max-w-xl')}
      >
        <SheetHeader className={sheetHeaderBar()}>
          <span className={dialogIconTile()}>
            <Icon className="size-5" />
          </span>

          <div className={dialogHeading}>
            <SheetTitle className={dialogTitle}>
              {t(isEdit ? 'editTitle' : 'title')}
            </SheetTitle>
            <SheetDescription className={dialogDescription}>
              {t(isEdit ? 'editDescription' : 'description')}
            </SheetDescription>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className={dialogClose}
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <CustomerForm
          mode={mode}
          initial={initial}
          owners={owners}
          defaultOwnerId={defaultOwnerId}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
