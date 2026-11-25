// components/recurring/RecurringFormView.tsx
'use client';

import { useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DateField from '@/component/DateField';
import { ChipGroup, FieldError, FormSection } from '@/component/form-parts';
import PageHeader from '@/component/PageHeader';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useCreateCustomer, useCustomers } from '@/lib/customers/hooks';
import { useDate } from '@/lib/data';
import { deviceCairoToday, nextOccurrences } from '@/lib/iso-date';
import { useMoney } from '@/lib/money';
import {
  toUiRecurringDetail,
  useRecurring,
  useSaveRecurring,
  type RecurringDetail,
  type RecurringInput,
} from '@/lib/recurring/hooks';
import { newDocumentVatRate, useSettings } from '@/lib/settings/hooks';
import { cn } from '@/lib/utils';
import {
  calcTotals,
  parseNumber,
  TERMS,
} from '@/lib/validations/invoice';
import {
  createRecurringSchema,
  END_MODES,
  FREQUENCIES,
  type RecurringFormValues,
} from '@/lib/validations/recurring';

import LineItemsSection from '../dashbord/invoices/LineItemsSection';
import CustomerCombobox, { type CustomerOption } from '../dashbord/invoices/CustomerCombobox';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const fieldClass =
  'rounded-btn border-line-strong bg-surface hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
const emptyItem = { description: '', quantity: '1', unitPrice: '', productId: null };

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt
        className={cn(
          'text-body',
          strong && 'text-ink text-base font-extrabold',
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'text-ink font-bold tabular-nums',
          strong && 'text-xl font-extrabold',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Loading() {
  return (
    <div className="text-muted flex justify-center py-20">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

/** A new recurring invoice, or (with `templateId`) one to edit. */
export default function RecurringFormView({ templateId }: { templateId?: string }) {
  const t = useTranslations('RecurringForm');
  const tApi = useTranslations('RecurringApi');
  const tApiErrors = useTranslations('ApiErrors');
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const settings = useSettings();
  // Customers to choose from (first 100 by name).
  const customers = useCustomers({ status: 'all', balance: 'all', sort: 'name', page: 1, pageSize: 100 });
  const templateQuery = useRecurring(templateId ?? '', { enabled: templateId !== undefined });

  // Everyone can look at a template; only those who issue invoices can create or change one.
  const canEdit = can(user.role, 'issueInvoices');
  if (!canEdit && templateId === undefined) {
    return <p className="text-muted text-sm">{tApiErrors('FORBIDDEN')}</p>;
  }
  if (
    (templateId !== undefined && templateQuery.isPending) ||
    (canEdit && (settings.isPending || customers.isPending))
  ) {
    return <Loading />;
  }
  if (templateId !== undefined && !templateQuery.data) {
    const notFound = templateQuery.error instanceof ApiError && templateQuery.error.status === 404;
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <p className={cn('text-sm font-semibold', notFound ? 'text-muted' : 'text-danger')}>
          {notFound ? tApi('notFound') : errorMessage(templateQuery.error)}
        </p>
        {!notFound && (
          <Button variant="outline" className={outlineBtn} onClick={() => templateQuery.refetch()}>
            {tApi('retry')}
          </Button>
        )}
        <Link href="/invoices/recurring" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
          {t('back')}
        </Link>
      </div>
    );
  }

  const template = templateQuery.data ? toUiRecurringDetail(templateQuery.data) : undefined;
  if (template && (template.status === 'ended' || !canEdit)) {
    return (
      <RecurringReadOnly
        template={template}
        note={template.status === 'ended' ? tApi('endedReadOnly') : tApi('viewOnly')}
      />
    );
  }

  // The company's rate (or 0 with VAT off): a preview; the server does the math.
  const vatRate = newDocumentVatRate(settings.data?.taxes);
  const options = customers.data?.items.map((c) => ({ id: c.id, name: c.name, city: c.city ?? '' })) ?? [];
  // The template's customer may not be among the first 100: add it so the picker shows it.
  if (template?.customerId && !options.some((c) => c.id === template.customerId)) {
    options.push({ id: template.customerId, name: template.customer, city: '' });
  }

  return (
    <RecurringForm
      key={template?.id ?? 'new'}
      template={template}
      customers={options}
      vatRate={vatRate}
    />
  );
}

/** A template that can't be changed here (it ended, or the user can't edit): its details only. */
function RecurringReadOnly({ template, note }: { template: RecurringDetail; note: string }) {
  const t = useTranslations('RecurringForm');
  const ti = useTranslations('InvoiceForm');
  const tItems = useTranslations('InvoiceForm.items');
  const tr = useTranslations('Recurring');
  const tApi = useTranslations('RecurringApi');
  const money = useMoney();
  const formatDate = useDate();

  const end =
    template.endMode === 'date' && template.endDate
      ? tApi('endsOn', { date: formatDate(template.endDate) })
      : template.endMode === 'count' && template.occurrences
        ? tApi('endsAfter', { count: template.occurrences })
        : t('schedule.endOptions.never');
  const details: [string, string][] = [
    [ti('details.customer'), template.customer],
    [t('schedule.frequency'), tr(`frequency.${template.frequency}`)],
    [tr('columns.status'), tr(`status.${template.status}`)],
    ...(template.status !== 'ended' && template.nextDate
      ? [[tr('columns.next'), formatDate(template.nextDate)] as [string, string]]
      : []),
    [t('schedule.startDate'), formatDate(template.startDate)],
    [t('schedule.end'), end],
    [tr('columns.generated'), tr('generated', { count: template.generatedCount })],
    [t('delivery.mode'), t(template.autoSend ? 'delivery.modes.send' : 'delivery.modes.draft')],
    ...((TERMS as readonly number[]).includes(template.terms)
      ? [[t('delivery.terms'), ti(`details.termsOptions.d${template.terms}`)] as [string, string]]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={template.name}
        description={note}
        actions={
          <Link href="/invoices/recurring" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('back')}
          </Link>
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
            <h2 className="text-ink text-sm font-extrabold">{t('details.title')}</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-body">{label}</dt>
                  <dd className="text-ink font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
            <h2 className="text-ink text-sm font-extrabold">{tItems('title')}</h2>
            <ul className="divide-line mt-1 divide-y">
              {template.lines.map((line, index) => (
                <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <span className="text-ink min-w-0 flex-1 truncate font-semibold">{line.description}</span>
                  <span className="text-muted tabular-nums">
                    {line.quantity} × {money(Number(line.unitPrice))}
                  </span>
                  <span className="text-ink w-24 text-end font-bold tabular-nums">
                    {money(Number(line.quantity) * Number(line.unitPrice))}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="border-line mt-2 space-y-2 border-t pt-3 text-sm">
              <SummaryRow label={ti('summary.subtotal')} value={money(template.subtotal)} />
              <SummaryRow label={ti('summary.vat', { rate: template.vatRate })} value={money(template.vat)} />
              <SummaryRow label={t('summary.perInvoice')} value={money(template.total)} strong />
            </dl>
            {template.notes && <p className="text-muted mt-3 text-xs whitespace-pre-line">{template.notes}</p>}
          </section>
        </div>
        <aside className="space-y-4">
          {template.lastError && template.status !== 'ended' && (
            <p className="text-danger flex items-start gap-1.5 text-xs font-semibold">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {tApi('lastErrorLong')}
            </p>
          )}
          <GeneratedInvoices template={template} />
        </aside>
      </div>
    </div>
  );
}

/** The latest invoices a template made, with links. */
function GeneratedInvoices({ template }: { template: RecurringDetail }) {
  const tApi = useTranslations('RecurringApi');
  const money = useMoney();
  const formatDate = useDate();
  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{tApi('invoicesTitle')}</h2>
      {template.invoices.length === 0 ? (
        <p className="text-muted mt-2 text-xs">{tApi('invoicesEmpty')}</p>
      ) : (
        <ul className="divide-line mt-1 divide-y">
          {template.invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
              <Link href={`/invoices/${invoice.number}`} className="text-brand-deep font-bold hover:underline" dir="ltr">
                {invoice.displayNumber}
              </Link>
              <span className="text-ink-2 font-semibold">{formatDate(invoice.issueDate)}</span>
              <span className="text-ink font-bold tabular-nums">{money(invoice.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecurringForm({
  template,
  customers,
  vatRate,
}: {
  template?: RecurringDetail;
  customers: CustomerOption[];
  /** From the settings: 14, or 0 when VAT is off (preview only; the server does the math). */
  vatRate: number;
}) {
  const t = useTranslations('RecurringForm');
  const ti = useTranslations('InvoiceForm');
  const tr = useTranslations('Recurring');
  const tApi = useTranslations('RecurringApi');
  const router = useRouter();
  const money = useMoney();
  const formatDate = useDate();
  const user = useSession();
  const errorMessage = useApiErrorMessage();
  const saveRecurring = useSaveRecurring();
  const createCustomer = useCreateCustomer();
  const isEdit = template !== undefined;
  // Customers added from this page are added to the options too.
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(customers);

  // Today in Cairo by this device's clock (the server checks with its own date).
  const todayIso = deviceCairoToday();

  const schema = useMemo(
    () =>
      createRecurringSchema({
        nameRequired: t('errors.nameRequired'),
        nameMax: t('errors.nameMax'),
        customerRequired: ti('errors.customerRequired'),
        dateRequired: ti('errors.dateRequired'),
        endDateRequired: t('errors.endDateRequired'),
        endDateAfter: t('errors.endDateAfter'),
        occurrencesInvalid: t('errors.occurrencesInvalid'),
        descriptionRequired: ti('errors.descriptionRequired'),
        quantityInvalid: ti('errors.quantityInvalid'),
        priceInvalid: ti('errors.priceInvalid'),
        notesMax: ti('errors.notesMax'),
      }),
    [t, ti],
  );

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(schema),
    defaultValues: template
      ? {
          name: template.name,
          customerId: template.customerId ?? '',
          frequency: template.frequency,
          startDate: template.startDate,
          endMode: template.endMode,
          endDate: template.endDate ?? '',
          occurrences: String(template.occurrences ?? 12),
          terms: template.terms,
          autoSend: template.autoSend,
          items: template.lines.length
            ? template.lines.map((line) => ({
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                productId: line.productId,
              }))
            : [emptyItem],
          notes: template.notes ?? '',
        }
      : {
          name: '',
          customerId: '',
          frequency: 'monthly',
          startDate: todayIso,
          endMode: 'never',
          endDate: '',
          occurrences: '12',
          terms: 30,
          autoSend: true,
          items: [emptyItem],
          notes: '',
        },
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const items = useWatch({ control, name: 'items' }) ?? [];
  const customerId = useWatch({ control, name: 'customerId' });
  const frequency = useWatch({ control, name: 'frequency' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endMode = useWatch({ control, name: 'endMode' });
  const endDate = useWatch({ control, name: 'endDate' });
  const occurrences = useWatch({ control, name: 'occurrences' });
  const autoSend = useWatch({ control, name: 'autoSend' });

  const totals = calcTotals(items, vatRate);
  const customerName = customerOptions.find(
    (customer) => customer.id === customerId,
  )?.name;

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

  // Editing without changing the start date or frequency keeps the schedule where it is.
  const keepsSchedule = isEdit && startDate === template.startDate && frequency === template.frequency;

  // The next 4 dates, after the end condition.
  const upcoming = useMemo(() => {
    if (!startDate) return [];
    let from = keepsSchedule ? (template?.nextDate ?? null) : startDate;
    if (!from) return [];
    // A paused template skips the dates it missed when it is resumed.
    if (template?.status === 'paused' && from < todayIso) from = todayIso;

    let dates = nextOccurrences(startDate, frequency, 240).filter((d) => d >= from);
    if (endMode === 'date' && endDate) dates = dates.filter((d) => d <= endDate);
    if (endMode === 'count') {
      // The invoices already made count toward the limit, even on a new schedule.
      const n = parseNumber(occurrences) - (template?.generatedCount ?? 0);
      dates = Number.isInteger(n) && n > 0 ? dates.slice(0, n) : [];
    }
    return dates.slice(0, 4);
  }, [startDate, frequency, endMode, endDate, occurrences, keepsSchedule, template, todayIso]);

  function showError(error: unknown) {
    if (error instanceof ApiError && error.code === 'START_DATE_PASSED') {
      setError('startDate', { message: errorMessage(error) }, { shouldFocus: true });
    } else if (error instanceof ApiError && error.code === 'INVALID_CUSTOMER') {
      setError('customerId', { message: ti('errors.customerRequired') }, { shouldFocus: true });
    } else if (error instanceof ApiError && error.code === 'VALIDATION_ERROR' && error.details?.fieldErrors) {
      const fields = error.details.fieldErrors;
      if (fields.endDate) setError('endDate', { message: t('errors.endDateAfter') });
      if (fields.occurrences) setError('occurrences', { message: t('errors.occurrencesInvalid') });
      if (fields.name) setError('name', { message: t('errors.nameMax') });
      if (!fields.endDate && !fields.occurrences && !fields.name) toast.error(errorMessage(error));
    } else {
      toast.error(errorMessage(error));
    }
  }

  const save = handleSubmit(async (values) => {
    const input: RecurringInput = {
      name: values.name.trim(),
      customerId: values.customerId,
      frequency: values.frequency,
      startDate: values.startDate,
      endMode: values.endMode,
      endDate: values.endMode === 'date' ? values.endDate : null,
      occurrences: values.endMode === 'count' ? parseNumber(values.occurrences) : null,
      terms: values.terms,
      autoSend: values.autoSend,
      // Numbers as typed (commas and spaces removed); the backend does the math.
      items: values.items.map((item) => ({
        description: item.description.trim(),
        quantity: String(parseNumber(item.quantity)),
        unitPrice: String(parseNumber(item.unitPrice)),
        productId: item.productId ?? null,
      })),
      notes: values.notes,
    };
    try {
      const saved = await saveRecurring.mutateAsync({ id: template?.id, input });
      const made = saved.generatedCount > (template?.generatedCount ?? 0) ? saved.lastInvoice : null;
      toast.success(
        made
          ? tApi('savedAndMade', { number: made.displayNumber })
          : saved.status === 'ended'
            ? tApi('savedEnded')
            : t(isEdit ? 'toasts.updated' : 'toasts.saved'),
      );
      router.push('/invoices/recurring');
    } catch (error) {
      showError(error);
    }
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t(isEdit ? 'editTitle' : 'title')}
        description={t(isEdit ? 'editSubtitle' : 'subtitle')}
        actions={
          <Link
            href="/invoices/recurring"
            className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('back')}
          </Link>
        }
      />

      <FormProvider {...form}>
        <form
          onSubmit={save}
          noValidate
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="min-w-0 space-y-5">
            {/* بيانات القالب */}
            <FormSection title={t('details.title')}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-ink mb-2 text-sm font-bold"
                  >
                    {t('details.name')}
                  </Label>
                  <Input
                    id="name"
                    placeholder={t('details.namePlaceholder')}
                    aria-invalid={!!errors.name}
                    className={fieldClass}
                    {...register('name')}
                  />
                  <FieldError message={errors.name?.message} />
                </div>

                <div>
                  <Label
                    htmlFor="customer"
                    className="text-ink mb-2 text-sm font-bold"
                  >
                    {ti('details.customer')}
                  </Label>
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <CustomerCombobox
                        id="customer"
                        value={field.value}
                        options={customerOptions}
                        placeholder={ti('details.customerPlaceholder')}
                        searchPlaceholder={ti('details.customerSearch')}
                        emptyText={ti('details.customerEmpty')}
                        addCustomerText={ti('details.addCustomer')}
                        addCustomerDescription={ti('details.addCustomerNote')}
                        customerNameLabel={ti('details.customerName')}
                        customerNamePlaceholder={ti(
                          'details.customerNamePlaceholder',
                        )}
                        customerCityLabel={ti('details.customerCity')}
                        customerCityPlaceholder={ti(
                          'details.customerCityPlaceholder',
                        )}
                        customerNameRequired={ti(
                          'errors.customerNameRequired',
                        )}
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
              </div>
            </FormSection>

            {/* الجدولة */}
            <FormSection title={t('schedule.title')}>
              <div className="space-y-5">
                <div>
                  <p
                    id="frequency-label"
                    className="text-ink mb-2 text-sm font-bold"
                  >
                    {t('schedule.frequency')}
                  </p>
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field }) => (
                      <ChipGroup
                        labelId="frequency-label"
                        value={field.value}
                        onChange={field.onChange}
                        options={FREQUENCIES.map((f) => ({
                          value: f,
                          label: tr(`frequency.${f}`),
                        }))}
                      />
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="startDate"
                      className="text-ink mb-2 text-sm font-bold"
                    >
                      {t('schedule.startDate')}
                    </Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DateField
                          id="startDate"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={ti('details.pickDate')}
                          invalid={!!errors.startDate}
                          minDate={isEdit ? undefined : todayIso}
                        />
                      )}
                    />
                    <FieldError message={errors.startDate?.message} />
                  </div>
                </div>

                <div>
                  <p id="end-label" className="text-ink mb-2 text-sm font-bold">
                    {t('schedule.end')}
                  </p>
                  <Controller
                    name="endMode"
                    control={control}
                    render={({ field }) => (
                      <ChipGroup
                        labelId="end-label"
                        value={field.value}
                        onChange={field.onChange}
                        className="sm:grid-cols-3"
                        options={END_MODES.map((m) => ({
                          value: m,
                          label: t(`schedule.endOptions.${m}`),
                        }))}
                      />
                    )}
                  />

                  {endMode === 'date' && (
                    <div className="mt-4 sm:max-w-[50%]">
                      <Label
                        htmlFor="endDate"
                        className="text-ink mb-2 text-sm font-bold"
                      >
                        {t('schedule.endDate')}
                      </Label>
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                          <DateField
                            id="endDate"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={ti('details.pickDate')}
                            invalid={!!errors.endDate}
                            minDate={startDate}
                          />
                        )}
                      />
                      <FieldError message={errors.endDate?.message} />
                    </div>
                  )}

                  {endMode === 'count' && (
                    <div className="mt-4 sm:max-w-[50%]">
                      <Label
                        htmlFor="occurrences"
                        className="text-ink mb-2 text-sm font-bold"
                      >
                        {t('schedule.occurrences')}
                      </Label>
                      <Input
                        id="occurrences"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-invalid={!!errors.occurrences}
                        className={cn(fieldClass, 'tabular-nums')}
                        {...register('occurrences')}
                      />
                      <FieldError message={errors.occurrences?.message} />
                    </div>
                  )}
                </div>
              </div>
            </FormSection>

            {/* البنود */}
            <LineItemsSection />

            {/* التسليم */}
            <FormSection title={t('delivery.title')}>
              <div className="space-y-5">
                <div>
                  <p
                    id="terms-label"
                    className="text-ink mb-2 text-sm font-bold"
                  >
                    {t('delivery.terms')}
                  </p>
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <ChipGroup
                        labelId="terms-label"
                        value={field.value}
                        onChange={field.onChange}
                        options={TERMS.map((n) => ({
                          value: n,
                          label: ti(`details.termsOptions.d${n}`),
                        }))}
                      />
                    )}
                  />
                </div>

                <div>
                  <p
                    id="mode-label"
                    className="text-ink mb-2 text-sm font-bold"
                  >
                    {t('delivery.mode')}
                  </p>
                  <Controller
                    name="autoSend"
                    control={control}
                    render={({ field }) => (
                      <ChipGroup
                        labelId="mode-label"
                        value={field.value ? 'send' : 'draft'}
                        onChange={(v) => field.onChange(v === 'send')}
                        className="sm:grid-cols-2"
                        options={[
                          { value: 'send', label: t('delivery.modes.send') },
                          { value: 'draft', label: t('delivery.modes.draft') },
                        ]}
                      />
                    )}
                  />
                  <p className="text-muted mt-2 text-xs">
                    {t(
                      autoSend ? 'delivery.hints.send' : 'delivery.hints.draft',
                    )}
                  </p>
                </div>
              </div>
            </FormSection>

            {/* ملاحظات */}
            <FormSection title={ti('notes.title')}>
              <Textarea
                rows={3}
                placeholder={ti('notes.placeholder')}
                aria-label={ti('notes.title')}
                aria-invalid={!!errors.notes}
                className="rounded-btn border-line-strong bg-surface hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 resize-none focus-visible:ring-2"
                {...register('notes')}
              />
              <FieldError message={errors.notes?.message} />
            </FormSection>
          </div>

          {/* الملخص */}
          <aside className="lg:sticky lg:top-6">
            <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
              <div className="border-line border-b pb-3">
                <h2 className="text-ink text-base font-extrabold">
                  {t('summary.title')}
                </h2>
              </div>

              {customerName && (
                <p className="text-muted mt-3 truncate text-xs">
                  {customerName} · {tr(`frequency.${frequency}`)}
                </p>
              )}

              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  label={ti('summary.subtotal')}
                  value={money(totals.subtotal)}
                />
                <SummaryRow
                  label={ti('summary.vat', { rate: vatRate })}
                  value={money(totals.vat)}
                />

                <div className="border-ink border-t-2 pt-4">
                  <SummaryRow
                    label={t('summary.perInvoice')}
                    value={money(totals.total)}
                    strong
                  />
                </div>
              </dl>

              <div className="border-line mt-4 border-t pt-4">
                <h3 className="text-ink text-sm font-extrabold">
                  {t('summary.upcoming')}
                </h3>

                {upcoming.length === 0 ? (
                  <p className="text-muted mt-2 text-xs">{t('summary.none')}</p>
                ) : (
                  <ul className="divide-line mt-1 divide-y">
                    {upcoming.map((d) => (
                      <li
                        key={d}
                        className="flex items-center justify-between gap-3 py-2.5 text-xs"
                      >
                        <span className="text-ink-2 font-semibold">
                          {formatDate(d)}
                        </span>
                        <span className="text-ink font-bold tabular-nums">
                          {money(totals.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 space-y-2.5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-btn bg-brand hover:bg-brand/90 h-11 w-full text-sm font-bold text-white"
                >
                  {t(isEdit ? 'actions.saveChanges' : 'actions.save')}
                </Button>
                <Link
                  href="/invoices/recurring"
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'text-muted hover:text-ink h-11 w-full text-sm font-bold',
                  )}
                >
                  {t('actions.cancel')}
                </Link>
                {isEdit && (
                  <p className="text-muted px-1 pt-1 text-xs leading-5">
                    {t('editNote')}
                  </p>
                )}
              </div>
            </section>
            {template?.lastError && (
              <p className="text-danger mt-4 flex items-start gap-1.5 text-xs font-semibold">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {tApi('lastErrorLong')}
              </p>
            )}
            {template && (
              <div className="mt-4">
                <GeneratedInvoices template={template} />
              </div>
            )}
          </aside>
        </form>
      </FormProvider>
    </div>
  );
}