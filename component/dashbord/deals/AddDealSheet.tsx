// components/deals/AddDealSheet.tsx
'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Kanban, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import DateField from '@/component/DateField';
import { ChipGroup, FieldError } from '@/component/form-parts';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { rtlLocales } from '@/i18n/routing';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useCreateCustomer, useCustomers, useTeamDirectory } from '@/lib/customers/hooks';
import { probabilityOf, useDealsClock, type Deal, type Owner } from '@/lib/deals/model';
import { addDaysIso } from '@/lib/iso-date';
import { useMoney, useMoneyParts } from '@/lib/money';
import { parseNumber } from '@/lib/validations/invoice';
import { createDealSchema, dealToFormValues, OPEN_STAGES, type DealFormValues } from '@/lib/validations/deal';
import { cn } from '@/lib/utils';
import CustomerCombobox, { type CustomerOption } from '../invoices/CustomerCombobox';
import OwnerPicker, { useOwnerInvite } from '../team/OwnerPicker';

export type DealSubmit = DealFormValues;

const fieldClass =
  'rounded-btn border-line-strong bg-surface text-ink placeholder:text-muted hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
const labelClass = 'text-ink mb-2 text-sm font-bold';

function DealForm({
  deal,
  customers,
  owners,
  onSubmit,
  onCancel,
}: {
  deal?: Deal;
  customers: CustomerOption[];
  owners: Owner[];
  onSubmit: (values: DealSubmit) => Promise<boolean>;
  onCancel: () => void;
}) {
  const t = useTranslations('Deals.addSheet');
  const tStages = useTranslations('Deals.stages');
  const ti = useTranslations('InvoiceForm');
  const format = useFormatter();
  const money = useMoney();
  const moneyParts = useMoneyParts();
  const { symbol } = moneyParts(0);
  const { today } = useDealsClock();
  const user = useSession();
  const errorMessage = useApiErrorMessage();
  const createCustomer = useCreateCustomer();

  // Someone new can be invited onto the team from the owner picker.
  const ownerInvite = useOwnerInvite();

  // Customers added from this sheet join the list too.
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(() =>
    deal && !customers.some((c) => c.id === deal.customerId)
      ? [...customers, { id: deal.customerId, name: deal.customer, city: '' }]
      : customers,
  );

  const schema = useMemo(
    () =>
      createDealSchema({
        titleRequired: t('errors.titleRequired'),
        titleMax: t('errors.titleMax'),
        customerRequired: ti('errors.customerRequired'),
        valueInvalid: t('errors.valueInvalid'),
        dateRequired: t('errors.dateRequired'),
        notesMax: t('errors.notesMax'),
      }),
    [t, ti],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({
    resolver: zodResolver(schema),
    defaultValues: deal
      ? dealToFormValues(deal)
      : {
          title: '',
          customerId: '',
          value: '',
          stage: 'lead',
          // Whoever adds it is responsible, if they are on the list.
          ownerId: owners.some((o) => o.id === user.id) ? user.id : '',
          closeDate: addDaysIso(today, 30),
          followUpDate: '',
          awaitingReply: false,
          notes: '',
        },
  });

  const value = useWatch({ control, name: 'value' }) ?? '';
  const stage = useWatch({ control, name: 'stage' });
  const amount = parseNumber(value);
  const validAmount = value.trim() !== '' && Number.isFinite(amount) && amount > 0;
  const probability = probabilityOf(stage);
  const won = deal?.stage === 'won';

  /** "Add customer" in the picker creates a real customer (same as the customers page). */
  async function addCustomer(customer: { name: string; city: string }) {
    if (!can(user.role, 'editCustomers')) {
      toast.error(errorMessage(new ApiError(403, 'FORBIDDEN', '')));
      return null;
    }
    try {
      const { customer: created } = await createCustomer.mutateAsync({
        name: customer.name,
        city: customer.city,
        contactName: '',
        phone: '',
        email: '',
        taxNumber: '',
        notes: '',
        assignedToId: user.id,
      });
      setCustomerOptions((options) => [...options, { id: created.id, name: created.name, city: created.city ?? '' }]);
      return created.id;
    } catch (error) {
      toast.error(errorMessage(error));
      return null;
    }
  }

  const submit = handleSubmit(async (v) => {
    await onSubmit(v);
  });

  return (
    <>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className={cn(dialogScrollBody, 'space-y-5 p-6')}>
          {/* العنوان */}
          <div>
            <Label htmlFor="d-title" className={labelClass}>
              {t('dealTitle')}
            </Label>
            <Input
              id="d-title"
              autoFocus
              autoComplete="off"
              placeholder={t('dealTitlePlaceholder')}
              aria-invalid={!!errors.title}
              className={fieldClass}
              {...register('title')}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* العميل */}
          <div>
            <Label htmlFor="d-customer" className={labelClass}>
              {ti('details.customer')}
            </Label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <CustomerCombobox
                  id="d-customer"
                  value={field.value}
                  options={customerOptions}
                  placeholder={ti('details.customerPlaceholder')}
                  searchPlaceholder={ti('details.customerSearch')}
                  emptyText={ti('details.customerEmpty')}
                  addCustomerText={ti('details.addCustomer')}
                  addCustomerDescription={ti('details.addCustomerNote')}
                  customerNameLabel={ti('details.customerName')}
                  customerNamePlaceholder={ti('details.customerNamePlaceholder')}
                  customerCityLabel={ti('details.customerCity')}
                  customerCityPlaceholder={ti('details.customerCityPlaceholder')}
                  customerNameRequired={ti('errors.customerNameRequired')}
                  createCustomerText={ti('details.createCustomer')}
                  cancelText={ti('actions.cancel')}
                  invalid={!!errors.customerId}
                  onChange={field.onChange}
                  onAddCustomer={addCustomer}
                />
              )}
            />
            <FieldError message={errors.customerId?.message} />
          </div>

          {/* القيمة */}
          <div>
            <Label htmlFor="d-value" className={labelClass}>
              {t('value')}
            </Label>
            <div className="relative">
              <Input
                id="d-value"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                aria-invalid={!!errors.value}
                className={cn(fieldClass, 'pe-14 tabular-nums')}
                {...register('value')}
              />
              <span className="text-muted pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold">
                {symbol}
              </span>
            </div>
            <FieldError message={errors.value?.message} />
          </div>

          {/* المرحلة */}
          {!won && (
            <div>
              <p id="d-stage-label" className={labelClass}>
                {t('stage')}
              </p>
              <Controller
                name="stage"
                control={control}
                render={({ field }) => (
                  <ChipGroup
                    labelId="d-stage-label"
                    value={field.value}
                    onChange={field.onChange}
                    className="sm:grid-cols-2"
                    options={OPEN_STAGES.map((s) => ({ value: s, label: tStages(s) }))}
                  />
                )}
              />

              {validAmount && (
                <p className="bg-brand-soft text-brand-deep mt-3 rounded-lg px-3 py-2 text-xs font-bold tabular-nums">
                  {t('expectedHint', {
                    percent: format.number(probability, { style: 'percent', numberingSystem: 'latn' }),
                    amount: money(Math.round(amount * probability)),
                  })}
                </p>
              )}
            </div>
          )}

          {/* المسؤول + الإغلاق: تحت بعض، الشيت ضيق على تاريخ كامل في نص عرضه */}
          <div className="grid gap-5">
            <div>
              <Label htmlFor="d-owner" className={labelClass}>
                {t('owner')}
              </Label>
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <OwnerPicker
                    id="d-owner"
                    value={field.value}
                    owners={owners}
                    allowNone
                    invite={ownerInvite}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="d-close" className={labelClass}>
                {won ? t('wonDate') : t('closeDate')}
              </Label>
              <Controller
                name="closeDate"
                control={control}
                render={({ field }) => (
                  <DateField
                    id="d-close"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('pickDate')}
                    invalid={!!errors.closeDate}
                    minDate={won || deal ? undefined : today}
                  />
                )}
              />
              <FieldError message={errors.closeDate?.message} />
            </div>
          </div>

          {/* المتابعة: التاريخ بعرض الشيت، و"في انتظار الرد" سطر تحته (الشيت أضيق من إنهم يبقوا جنب بعض) */}
          {!won && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="d-follow" className={labelClass}>
                  {t('followUpDate')}
                </Label>
                <Controller
                  name="followUpDate"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <DateField
                          id="d-follow"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t('noFollowUp')}
                          minDate={today}
                        />
                      </div>
                      {field.value && (
                        <button
                          type="button"
                          onClick={() => field.onChange('')}
                          aria-label={t('clearFollowUp')}
                          className="text-muted hover:text-ink hover:bg-canvas rounded-md p-2"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="awaitingReply"
                control={control}
                render={({ field }) => (
                  <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-semibold">
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    <span className="text-ink leading-5">{t('awaitingReply')}</span>
                  </label>
                )}
              />
            </div>
          )}

          {/* ملاحظات */}
          <div>
            <Label htmlFor="d-notes" className={labelClass}>
              {t('notes')}
            </Label>
            <Textarea
              id="d-notes"
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
            className="rounded-btn bg-brand hover:bg-brand/90 h-11 px-8 font-bold text-white"
          >
            {deal ? t('saveChanges') : t('submit')}
          </Button>
        </div>
      </form>
      {/* Outside the form: a submit in the invitation must not submit the deal. */}
      {ownerInvite.dialogs}
    </>
  );
}

export default function AddDealSheet({
  deal,
  open,
  onOpenChange,
  onSubmit,
}: {
  deal?: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Saves; resolves true when it worked (the parent closes the sheet then). */
  onSubmit: (values: DealSubmit, deal?: Deal) => Promise<boolean>;
}) {
  const t = useTranslations('Deals.addSheet');
  const locale = useLocale();
  // Customers to choose from (first 100 by name) and the team.
  const customers = useCustomers(
    { status: 'all', balance: 'all', sort: 'name', page: 1, pageSize: 100 },
    { enabled: open },
  );
  const team = useTeamDirectory();
  const ready = !customers.isPending && !team.isPending;

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
            <Kanban className="size-5" />
          </span>

          <div className={dialogHeading}>
            <SheetTitle className={dialogTitle}>{deal ? t('editTitle') : t('title')}</SheetTitle>
            <SheetDescription className={dialogDescription}>
              {deal ? t('editDescription') : t('description')}
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

        {open && !ready ? (
          <div className="text-muted flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : open ? (
          <DealForm
            key={deal?.id ?? 'new'}
            deal={deal}
            customers={customers.data?.items.map((c) => ({ id: c.id, name: c.name, city: c.city ?? '' })) ?? []}
            owners={(team.data ?? []).map((m) => ({ id: m.id, name: m.name }))}
            onSubmit={(values) => onSubmit(values, deal)}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
