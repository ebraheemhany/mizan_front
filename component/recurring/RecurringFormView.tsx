// components/recurring/RecurringFormView.tsx
'use client';

import { useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DateField from '@/component/DateField';
import { ChipGroup, FieldError, FormSection } from '@/component/form-parts';
import PageHeader from '@/component/PageHeader';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import { nextOccurrences } from '@/lib/iso-date';
import { CUSTOMERS } from '@/lib/mock/customers';
import { MOCK_NOW } from '@/lib/mock/invoices';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  calcTotals,
  parseNumber,
  TERMS,
  VAT_RATE,
} from '@/lib/validations/invoice';
import {
  createRecurringSchema,
  END_MODES,
  FREQUENCIES,
  type RecurringFormValues,
} from '@/lib/validations/recurring';

import LineItemsSection from '../dashbord/invoices/LineItemsSection';
import CustomerCombobox from '../dashbord/invoices/CustomerCombobox';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const fieldClass =
  'rounded-btn border-line-strong bg-surface hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
const INITIAL_CUSTOMER_OPTIONS = CUSTOMERS.map(({ id, name, city }) => ({
  id,
  name,
  city,
}));

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

export default function RecurringFormView({
  mode = 'create',
  initial,
}: {
  mode?: 'create' | 'edit';
  initial?: RecurringFormValues;
}) {
  const t = useTranslations('RecurringForm');
  const ti = useTranslations('InvoiceForm');
  const tr = useTranslations('Recurring');
  const router = useRouter();
  const money = useMoney();
  const formatDate = useDate();
  const isEdit = mode === 'edit';
  const [customerOptions, setCustomerOptions] = useState(
    INITIAL_CUSTOMER_OPTIONS,
  );

  // TODO: التاريخ الحقيقي لما نربط الـ API
  const todayIso = MOCK_NOW.toISOString().slice(0, 10);

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
    defaultValues: initial ?? {
      name: '',
      customerId: '',
      frequency: 'monthly',
      startDate: todayIso,
      endMode: 'never',
      endDate: '',
      occurrences: '12',
      terms: 30,
      autoSend: true,
      items: [{ description: '', quantity: '1', unitPrice: '' }],
      notes: '',
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const items = useWatch({ control, name: 'items' }) ?? [];
  const customerId = useWatch({ control, name: 'customerId' });
  const frequency = useWatch({ control, name: 'frequency' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endMode = useWatch({ control, name: 'endMode' });
  const endDate = useWatch({ control, name: 'endDate' });
  const occurrences = useWatch({ control, name: 'occurrences' });
  const autoSend = useWatch({ control, name: 'autoSend' });

  const totals = calcTotals(items);
  const customerName = customerOptions.find(
    (customer) => customer.id === customerId,
  )?.name;

  function addCustomer(customer: { name: string; city: string }) {
    const id = `new-${crypto.randomUUID()}`;
    setCustomerOptions((options) => [...options, { id, ...customer }]);
    return id;
  }

  // أول 4 مواعيد جاية بعد تطبيق شرط الانتهاء
  const upcoming = useMemo(() => {
    if (!startDate) return [];

    let dates = nextOccurrences(startDate, frequency, 12);

    if (endMode === 'date' && endDate)
      dates = dates.filter((d) => d <= endDate);
    if (endMode === 'count') {
      const n = parseNumber(occurrences);
      if (Number.isInteger(n) && n > 0) dates = dates.slice(0, n);
    }

    return dates.slice(0, 4);
  }, [startDate, frequency, endMode, endDate, occurrences]);

  const save = handleSubmit(() => {
    // TODO: حفظ القالب أو تحديثه فعلياً لما نربط الـ API
    toast.success(t(isEdit ? 'toasts.updated' : 'toasts.saved'));
    if (isEdit) router.push('/invoices/recurring');
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
                  label={ti('summary.vat', { rate: VAT_RATE })}
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
          </aside>
        </form>
      </FormProvider>
    </div>
  );
}