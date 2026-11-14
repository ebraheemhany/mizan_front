// components/deals/AddDealSheet.tsx
'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown, Kanban, Plus, UserRoundPlus, X } from 'lucide-react';
import DateField from '@/component/DateField';
import { ChipGroup, FieldError } from '@/component/form-parts';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { rtlLocales } from '@/i18n/routing';
import { addDaysIso } from '@/lib/iso-date';
import { CUSTOMERS, type Owner } from '@/lib/mock/customers';
import { probabilityOf, TODAY } from '@/lib/mock/deals';
import { useMoney, useMoneyParts } from '@/lib/money';
import { parseNumber } from '@/lib/validations/invoice';
import {
  createDealSchema,
  dealToFormValues,
  OPEN_STAGES,
  type DealFormValues,
} from '@/lib/validations/deal';
import { cn } from '@/lib/utils';
import CustomerCombobox from '../invoices/CustomerCombobox';
import type { Deal } from '@/lib/mock/deals';

export type DealSubmit = DealFormValues & { customerName: string };

const fieldClass =
  'rounded-btn border-line-strong bg-surface text-ink placeholder:text-muted hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
const labelClass = 'text-ink mb-2 text-sm font-bold';

const INITIAL_CUSTOMER_OPTIONS = CUSTOMERS.map(({ id, name, city }) => ({ id, name, city }));

function OwnerCombobox({
  id,
  value,
  owners,
  invalid,
  labels,
  onChange,
  onAddOwner,
}: {
  id: string;
  value: string;
  owners: Owner[];
  invalid?: boolean;
  labels: {
    placeholder: string;
    search: string;
    empty: string;
    add: string;
    name: string;
    namePlaceholder: string;
    nameRequired: string;
    create: string;
    cancel: string;
  };
  onChange: (id: string) => void;
  onAddOwner: (name: string) => Owner;
}) {
  const [open, setOpen] = useState(false);
  const [addingOwner, setAddingOwner] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const current = owners.find((owner) => owner.id === value);

  function addOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(labels.nameRequired);
      return;
    }

    const owner = onAddOwner(trimmedName);
    onChange(owner.id);
    setName('');
    setNameError('');
    setAddingOwner(false);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setAddingOwner(false);
      setName('');
      setNameError('');
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          'rounded-btn bg-surface flex h-11 w-full items-center gap-3 border px-3 text-start text-sm font-semibold transition-colors outline-none focus-visible:ring-2',
          invalid
            ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/15'
            : 'border-line-strong hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15',
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', current ? 'text-ink' : 'text-muted')}>
          {current ? current.name : labels.placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border bg-surface p-0 shadow-lg"
      >
        <Command className="rounded-xl bg-surface p-1.5">
          {addingOwner ? (
            <form onSubmit={addOwner} className="space-y-3 p-2">
              <div className="flex items-center gap-2 pb-1">
                <UserRoundPlus className="text-brand size-4" />
                <h3 className="text-ink text-sm font-bold">{labels.add}</h3>
              </div>
              <label className="text-ink-2 block text-xs font-semibold">
                {labels.name}
                <Input
                  autoFocus
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (event.target.value.trim()) setNameError('');
                  }}
                  placeholder={labels.namePlaceholder}
                  aria-invalid={!!nameError}
                  className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 mt-1.5 h-10 text-sm"
                />
              </label>
              {nameError && (
                <p role="alert" className="text-danger text-xs font-semibold">
                  {nameError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddingOwner(false);
                    setName('');
                    setNameError('');
                  }}
                  className="rounded-btn border-line-strong h-9 px-3 text-xs"
                >
                  {labels.cancel}
                </Button>
                <Button
                  type="submit"
                  className="rounded-btn bg-brand hover:bg-brand/90 h-9 px-3 text-xs font-bold text-white"
                >
                  {labels.create}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <CommandInput
                placeholder={labels.search}
                className="text-ink placeholder:text-muted"
              />
              <CommandList className="max-h-64 py-1">
                <CommandEmpty className="text-muted py-5">{labels.empty}</CommandEmpty>
                <CommandGroup>
                  {owners.map((owner) => (
                    <CommandItem
                      key={owner.id}
                      value={owner.name}
                      onSelect={() => {
                        onChange(owner.id);
                        setOpen(false);
                      }}
                      className="text-ink cursor-pointer"
                    >
                      <span className="min-w-0 flex-1 truncate">{owner.name}</span>
                      {owner.id === value && <Check className="text-brand size-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-line border-t p-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddingOwner(true)}
                  className="text-brand hover:bg-brand-soft h-9 w-full justify-start gap-2 px-2 text-xs font-bold"
                >
                  <Plus className="size-4" />
                  {labels.add}
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DealForm({
  deal,
  onSubmit,
  onCancel,
  owners,
  onAddOwner,
}: {
  deal?: Deal;
  onSubmit: (values: DealSubmit) => void;
  onCancel: () => void;
  owners: Owner[];
  onAddOwner: (name: string) => Owner;
}) {
  const t = useTranslations('Deals.addSheet');
  const tStages = useTranslations('Deals.stages');
  const ti = useTranslations('InvoiceForm');
  const format = useFormatter();
  const money = useMoney();
  const moneyParts = useMoneyParts();
  const { symbol } = moneyParts(0);

  const existingCustomer = INITIAL_CUSTOMER_OPTIONS.find(
    (customer) => customer.id === deal?.customerId || customer.name === deal?.customer,
  );
  const customCustomer = deal && !existingCustomer
    ? { id: `deal-${deal.id}`, name: deal.customer, city: '' }
    : null;
  const [customerOptions, setCustomerOptions] = useState(() =>
    customCustomer
      ? [...INITIAL_CUSTOMER_OPTIONS, customCustomer]
      : INITIAL_CUSTOMER_OPTIONS,
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
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(schema),
    defaultValues: deal
      ? {
          ...dealToFormValues(deal),
          customerId: existingCustomer?.id ?? customCustomer?.id ?? '',
        }
      : {
          title: '',
          customerId: '',
          value: '',
          stage: 'lead',
          ownerId: owners[0].id,
          closeDate: addDaysIso(TODAY, 30),
          notes: '',
        },
  });

  const value = useWatch({ control, name: 'value' }) ?? '';
  const stage = useWatch({ control, name: 'stage' });

  const amount = parseNumber(value);
  const validAmount = value.trim() !== '' && Number.isFinite(amount) && amount > 0;
  const probability = probabilityOf(stage);

  function addCustomer(customer: { name: string; city: string }) {
    const id = `new-${crypto.randomUUID()}`;
    setCustomerOptions((options) => [...options, { id, ...customer }]);
    return id;
  }

  const submit = handleSubmit((v) =>
    onSubmit({ ...v, customerName: customerOptions.find((c) => c.id === v.customerId)?.name ?? '' }),
  );

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
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
        {deal?.stage !== 'won' && (
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

        {/* المسؤول + الإغلاق */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="d-owner" className={labelClass}>
              {t('owner')}
            </Label>
            <Controller
              name="ownerId"
              control={control}
              render={({ field }) => {
                return (
                  <OwnerCombobox
                    id="d-owner"
                    value={field.value}
                    owners={owners}
                    invalid={!!errors.ownerId}
                    labels={{
                      placeholder: t('owner'),
                      search: t('ownerSearch'),
                      empty: t('ownerEmpty'),
                      add: t('addOwner'),
                      name: t('ownerName'),
                      namePlaceholder: t('ownerNamePlaceholder'),
                      nameRequired: t('errors.ownerNameRequired'),
                      create: t('createOwner'),
                      cancel: t('cancel'),
                    }}
                    onChange={field.onChange}
                    onAddOwner={onAddOwner}
                  />
                );
              }}
            />
          </div>

          <div>
            <Label htmlFor="d-close" className={labelClass}>
              {t('closeDate')}
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
                  minDate={deal?.stage === 'won' ? undefined : TODAY}
                />
              )}
            />
            <FieldError message={errors.closeDate?.message} />
          </div>
        </div>

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

      <div className="border-line bg-canvas/60 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
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
          className="rounded-btn bg-brand hover:bg-brand/90 h-11 px-8 font-bold text-white"
        >
          {deal ? t('saveChanges') : t('submit')}
        </Button>
      </div>
    </form>
  );
}

export default function AddDealSheet({
  deal,
  open,
  onOpenChange,
  onSubmit,
  owners,
  onAddOwner,
}: {
  deal?: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DealSubmit, deal?: Deal) => void;
  owners: Owner[];
  onAddOwner: (name: string) => Owner;
}) {
  const t = useTranslations('Deals.addSheet');
  const locale = useLocale();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        // بيفتح من جهة نهاية الصفحة: شمال في العربي ويمين في الإنجليزي
        side={rtlLocales.includes(locale) ? 'left' : 'right'}
        showCloseButton={false}
        className="w-full gap-0 border-0 bg-surface p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-line relative flex-row items-center gap-3.5 border-b px-6 py-5 text-start">
          <span className="bg-brand-soft text-brand flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Kanban className="size-5" />
          </span>

          <div className="min-w-0 pe-8">
            <SheetTitle className="text-ink text-lg font-extrabold">
              {deal ? t('editTitle') : t('title')}
            </SheetTitle>
            <SheetDescription className="mt-0.5 text-xs leading-5">
              {deal ? t('editDescription') : t('description')}
            </SheetDescription>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className="text-muted hover:bg-canvas hover:text-ink absolute end-4 top-4 rounded-md p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <DealForm
          key={`${deal?.id ?? 'new'}-${open}`}
          deal={deal}
          onSubmit={(values) => onSubmit(values, deal)}
          onCancel={() => onOpenChange(false)}
          owners={owners}
          onAddOwner={onAddOwner}
        />
      </SheetContent>
    </Sheet>
  );
}