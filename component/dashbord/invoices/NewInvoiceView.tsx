// components/invoices/NewInvoiceView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { ar, enUS } from 'react-day-picker/locale';
import { toast } from 'sonner';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/navigation';
import { rtlLocales } from '@/i18n/routing';
import { useDate } from '@/lib/data';
import { addDaysIso, deviceCairoToday, fromIso, toIso } from '@/lib/iso-date';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useCreateCustomer, useCustomers } from '@/lib/customers/hooks';
import { useCreateInvoice } from '@/lib/invoices/hooks';
import { useSettings } from '@/lib/settings/hooks';
import { useMoney } from '@/lib/money';
import { toUiQuoteDetail, useQuote, type QuoteDetail } from '@/lib/quotes/hooks';
import { cn } from '@/lib/utils';
import {
  calcTotals,
  parseNumber,
  createInvoiceSchema,
  lineAmount,
  TERMS,
  VAT_RATE,
  type InvoiceFormValues,
} from '@/lib/validations/invoice';
import CustomerCombobox from './CustomerCombobox';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-10 gap-2 text-xs font-bold';
const fieldClass =
  'rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';

type CustomerOption = { id: string; name: string; city: string };
const EMPTY_ITEM = { description: '', quantity: '1', unitPrice: '' };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6">
      <div className="border-line border-b pb-3">
        <h2 className="text-ink text-base font-extrabold">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
      {message}
    </p>
  );
}

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
          strong && 'text-brand-deep text-xl font-extrabold',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default function NewInvoiceView({
  sourceQuote,
}: {
  /** The accepted quote (its number) to convert: the form is pre-filled from it. */
  sourceQuote?: number;
}) {
  const t = useTranslations('InvoiceForm');
  const tApiErrors = useTranslations('ApiErrors');
  const user = useSession();
  const settings = useSettings();
  // Customers to choose from (first 100 by name).
  const customers = useCustomers({ status: 'all', balance: 'all', sort: 'name', page: 1, pageSize: 100 });
  const quoteQuery = useQuote(sourceQuote ?? 0, { enabled: sourceQuote !== undefined });
  // The quote the form was filled from. Kept once the form shows: creating the invoice
  // marks the quote converted, and that refetch must not swap the form for "already
  // converted" while the page moves on to the new invoice.
  const [formQuote, setFormQuote] = useState<QuoteDetail | null>(null);
  const queryClient = useQueryClient();
  /** The quote was converted or changed meanwhile: show the fresh state instead of the form. */
  async function quoteGone() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
    setFormQuote(null);
  }

  if (!can(user.role, 'issueInvoices')) {
    return <p className="text-muted text-sm">{tApiErrors('FORBIDDEN')}</p>;
  }
  if ((sourceQuote !== undefined && !formQuote && quoteQuery.isPending) || settings.isPending || customers.isPending) {
    return (
      <p className="text-muted flex items-center justify-center gap-2 py-20 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {sourceQuote !== undefined && t('fromQuote.loading')}
      </p>
    );
  }

  let quote: QuoteDetail | undefined;
  if (sourceQuote !== undefined && formQuote) {
    quote = formQuote;
  } else if (sourceQuote !== undefined) {
    if (!quoteQuery.data) {
      return <QuoteNotConvertible number={sourceQuote} error={quoteQuery.error} onRetry={() => quoteQuery.refetch()} />;
    }
    const loaded = toUiQuoteDetail(quoteQuery.data);
    // Only an accepted quote that has no invoice yet can be converted (the server checks too).
    if (loaded.status !== 'accepted' || loaded.invoice) {
      return <QuoteNotConvertible number={sourceQuote} quote={loaded} />;
    }
    // Updating state while rendering (React re-renders right away), not in an effect.
    setFormQuote(loaded);
    quote = loaded;
  }

  const vatEnabled = settings.data?.taxes.vatEnabled ?? true;
  const settingsTerms = settings.data?.numbering.paymentTermsDays ?? 30;
  const options = customers.data?.items.map((c) => ({ id: c.id, name: c.name, city: c.city ?? '' })) ?? [];
  // The quote's customer may not be among the first 100: add it so the picker shows it.
  if (quote?.customerId && !options.some((c) => c.id === quote.customerId)) {
    options.push({ id: quote.customerId, name: quote.customer, city: '' });
  }

  return (
    <InvoiceForm
      key={sourceQuote ?? 'blank'}
      sourceQuote={quote}
      onQuoteGone={quoteGone}
      customers={options}
      vatRate={vatEnabled ? VAT_RATE : 0}
      defaultTerms={(TERMS as readonly number[]).includes(settingsTerms) ? settingsTerms : 30}
    />
  );
}

/** Instead of the pre-filled form: the quote can't be loaded, isn't accepted, or is already converted. */
function QuoteNotConvertible({
  number,
  quote,
  error,
  onRetry,
}: {
  number: number;
  quote?: QuoteDetail;
  error?: unknown;
  onRetry?: () => void;
}) {
  const t = useTranslations('QuotesApi');
  const errorMessage = useApiErrorMessage();
  const notFound = !quote && error instanceof ApiError && error.status === 404;

  let title: string;
  if (quote?.invoice) title = t('convert.alreadyConverted', { number: quote.displayNumber, invoice: quote.invoice.displayNumber });
  else if (quote) title = t('convert.notAccepted', { number: quote.displayNumber });
  else if (notFound) title = t('notFoundTitle');
  else title = errorMessage(error);

  return (
    <div className="rounded-card border-line bg-surface mx-auto max-w-lg space-y-3 border p-8 text-center shadow-sm">
      <h1 className="text-ink text-lg font-extrabold">{title}</h1>
      <p className="text-muted text-sm">{t('convert.hint')}</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {!quote && !notFound && onRetry && (
          <Button variant="outline" className={outlineBtn} onClick={onRetry}>
            {t('retry')}
          </Button>
        )}
        {quote?.invoice && (
          <Link href={`/invoices/${quote.invoice.number}`} className={cn(buttonVariants(), 'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white')}>
            {t('viewInvoice', { number: quote.invoice.displayNumber })}
          </Link>
        )}
        {!notFound && (
          <Link href={`/quotes/${number}`} className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
            {t('convert.viewQuote')}
          </Link>
        )}
        <Link href="/invoices/new" className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}>
          {t('convert.blankInvoice')}
        </Link>
      </div>
    </div>
  );
}

function InvoiceForm({
  sourceQuote,
  onQuoteGone,
  customers,
  vatRate,
  defaultTerms,
}: {
  /** The accepted quote this invoice converts (pre-fills the form; sent as `fromQuote`). */
  sourceQuote?: QuoteDetail;
  /** The server refused the conversion (already converted, no longer accepted, or gone). */
  onQuoteGone: () => Promise<void>;
  customers: CustomerOption[];
  /** From the settings: 14, or 0 when VAT is off. */
  vatRate: number;
  /** From the settings (payment terms). */
  defaultTerms: number;
}) {
  const t = useTranslations('InvoiceForm');
  const locale = useLocale();
  const router = useRouter();
  const isRtl = rtlLocales.includes(locale);
  const money = useMoney();
  const formatDate = useDate();
  const [dateOpen, setDateOpen] = useState(false);
  const user = useSession();
  const errorMessage = useApiErrorMessage();
  const createInvoice = useCreateInvoice();
  const createCustomer = useCreateCustomer();
  // Customers added from this page are added to the options too.
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(customers);

  // Today in Cairo by this device's clock (the server's business date).
  const todayIso = deviceCairoToday();
  // From a quote: its customer, lines and note, dated today with the company's payment terms.
  const formInitial: InvoiceFormValues | undefined = sourceQuote
    ? {
        customerId: sourceQuote.customerId ?? '',
        issueDate: todayIso,
        terms: defaultTerms,
        items: sourceQuote.lines.length
          ? sourceQuote.lines.map((line) => ({
              description: line.title,
              quantity: String(line.quantity),
              unitPrice: String(line.unitPrice),
            }))
          : [EMPTY_ITEM],
        notes: sourceQuote.note.trim() || t('fromQuote.note', { number: sourceQuote.displayNumber }),
      }
    : undefined;

  const schema = useMemo(
    () =>
      createInvoiceSchema({
        customerRequired: t('errors.customerRequired'),
        dateRequired: t('errors.dateRequired'),
        descriptionRequired: t('errors.descriptionRequired'),
        quantityInvalid: t('errors.quantityInvalid'),
        priceInvalid: t('errors.priceInvalid'),
        notesMax: t('errors.notesMax'),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: formInitial ?? {
      customerId: '',
      issueDate: todayIso,
      terms: defaultTerms,
      items: [EMPTY_ITEM],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = useWatch({ control, name: 'items' }) ?? [];
  const issueDate = useWatch({ control, name: 'issueDate' });
  const terms = useWatch({ control, name: 'terms' });
  const customerId = useWatch({ control, name: 'customerId' });

  const totals = calcTotals(items, vatRate);
  const dueDate = issueDate ? addDaysIso(issueDate, terms) : '';
  const customerName = customerOptions.find((c) => c.id === customerId)?.name;

  /** "Add customer" in the picker creates a real customer (same as the customers page). */
  async function addInvoiceCustomer(customer: { name: string; city: string }) {
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

  const submit = (mode: 'draft' | 'send') =>
    handleSubmit(async (values) => {
      try {
        const invoice = await createInvoice.mutateAsync({
          customerId: values.customerId,
          issueDate: values.issueDate,
          terms: values.terms,
          // Numbers as typed (commas and spaces removed); the backend does the math.
          items: values.items.map((item) => ({
            description: item.description.trim(),
            quantity: String(parseNumber(item.quantity)),
            unitPrice: String(parseNumber(item.unitPrice)),
          })),
          notes: values.notes,
          send: mode === 'send',
          // The server marks the quote converted (409 if it's no longer accepted or already converted).
          fromQuote: sourceQuote?.number,
        });
        toast.success(t(mode === 'draft' ? 'toasts.draftSaved' : 'toasts.sent'));
        router.push('/invoices/' + invoice.number);
      } catch (error) {
        if (error instanceof ApiError && error.code === 'INVALID_CUSTOMER') {
          setError('customerId', { message: t('errors.customerRequired') });
        } else if (error instanceof ApiError && error.code === 'QUOTE_CUSTOMER_MISMATCH') {
          // From a quote: the invoice has to be for the quote's customer.
          setError('customerId', { message: errorMessage(error) }, { shouldFocus: true });
        } else if (
          sourceQuote &&
          error instanceof ApiError &&
          (error.code === 'QUOTE_ALREADY_CONVERTED' ||
            error.code === 'QUOTE_NOT_ACCEPTED' ||
            error.status === 404)
        ) {
          // Someone converted (or changed) the quote meanwhile: say so and show its state.
          toast.error(errorMessage(error));
          await onQuoteGone();
        } else if (error instanceof ApiError && error.code === 'FUTURE_ISSUE_DATE') {
          // Sending with a date after today: say so on the date field.
          setError('issueDate', { message: errorMessage(error) }, { shouldFocus: true });
        } else {
          toast.error(errorMessage(error));
        }
      }
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <Link
            href="/invoices"
            className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('back')}
          </Link>
        }
      />

      {/* شريط "معبّأة من عرض سعر" */}
      {sourceQuote && (
        <div className="bg-brand-soft text-brand-deep border-brand-mint flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-bold">
          <span>{t('fromQuote.banner', { number: sourceQuote.displayNumber })}</span>
          <Link
            href={`/quotes/${sourceQuote.number}`}
            className="text-xs underline"
          >
            {t('fromQuote.view')}
          </Link>
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="min-w-0 space-y-5">
          {/* بيانات الفاتورة */}
          <Section title={t('details.title')}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label
                  htmlFor="customer"
                  className="text-ink mb-2 text-sm font-bold"
                >
                  {t('details.customer')}
                </Label>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <CustomerCombobox
                      id="customer"
                      value={field.value}
                      options={customerOptions}
                      placeholder={t('details.customerPlaceholder')}
                      searchPlaceholder={t('details.customerSearch')}
                      emptyText={t('details.customerEmpty')}
                      addCustomerText={t('details.addCustomer')}
                      addCustomerDescription={t('details.addCustomerNote')}
                      customerNameLabel={t('details.customerName')}
                      customerNamePlaceholder={t(
                        'details.customerNamePlaceholder',
                      )}
                      customerCityLabel={t('details.customerCity')}
                      customerCityPlaceholder={t(
                        'details.customerCityPlaceholder',
                      )}
                      customerNameRequired={t('errors.customerNameRequired')}
                      createCustomerText={t('details.createCustomer')}
                      cancelText={t('actions.cancel')}
                      invalid={!!errors.customerId}
                      onChange={field.onChange}
                      onAddCustomer={addInvoiceCustomer}
                    />
                  )}
                />
                <FieldError message={errors.customerId?.message} />
              </div>

              <div>
                <Label
                  htmlFor="issueDate"
                  className="text-ink mb-2 text-sm font-bold"
                >
                  {t('details.issueDate')}
                </Label>
                <Controller
                  name="issueDate"
                  control={control}
                  render={({ field }) => {
                    const selected = field.value
                      ? fromIso(field.value)
                      : undefined;

                    return (
                      <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger
                          id="issueDate"
                          aria-invalid={!!errors.issueDate}
                          className={cn(
                            'rounded-btn bg-surface flex h-11 w-full items-center gap-3 border px-3 text-start text-sm transition-colors outline-none focus-visible:ring-2',
                            errors.issueDate
                              ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/15'
                              : 'border-line-strong hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15',
                          )}
                        >
                          <span className="bg-brand-soft flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <CalendarDays className="text-brand size-4" />
                          </span>
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate font-semibold',
                              field.value ? 'text-ink' : 'text-muted',
                            )}
                          >
                            {field.value
                              ? formatDate(field.value)
                              : t('details.pickDate')}
                          </span>
                          <ChevronDown className="text-muted size-4 shrink-0" />
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="border-line rounded-card bg-surface w-auto border p-1.5 shadow-lg"
                        >
                          <Calendar
                            mode="single"
                            selected={selected}
                            defaultMonth={selected}
                            onSelect={(d) => {
                              if (!d) return;
                              field.onChange(toIso(d));
                              setDateOpen(false);
                            }}
                            locale={isRtl ? ar : enUS}
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className="rounded-card bg-surface [--cell-size:--spacing(9)]"
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                <FieldError message={errors.issueDate?.message} />
              </div>

              <div>
                <p className="text-ink mb-2 text-sm font-bold">
                  {t('details.dueDate')}
                </p>
                <div
                  className={cn(
                    fieldClass,
                    'bg-canvas/60 text-ink flex items-center border px-3 text-sm font-semibold',
                  )}
                >
                  {dueDate ? formatDate(dueDate) : '—'}
                </div>
              </div>

              <div className="sm:col-span-2">
                <p id="terms-label" className="text-ink mb-2 text-sm font-bold">
                  {t('details.terms')}
                </p>
                <Controller
                  name="terms"
                  control={control}
                  render={({ field }) => (
                    <div
                      role="radiogroup"
                      aria-labelledby="terms-label"
                      className="grid grid-cols-3 gap-2.5 sm:grid-cols-5"
                    >
                      {TERMS.map((n) => {
                        const selected = field.value === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(n)}
                            className={cn(
                              'rounded-btn focus-visible:border-brand focus-visible:ring-brand/15 h-10 border text-xs font-bold transition-colors outline-none focus-visible:ring-2',
                              selected
                                ? 'border-brand bg-brand-soft text-brand-deep'
                                : 'border-line-strong bg-surface text-ink-2 hover:bg-canvas',
                            )}
                          >
                            {t(`details.termsOptions.d${n}`)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </div>
          </Section>

          {/* البنود */}
          <Section title={t('items.title')}>
            <div className="border-line text-muted mb-3 hidden gap-3 border-b pb-2 text-xs font-bold sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_8rem_7rem_2.25rem]">
              <span>{t('items.description')}</span>
              <span>{t('items.quantity')}</span>
              <span>{t('items.price')}</span>
              <span>{t('items.total')}</span>
              <span />
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const row = items[index];
                const rowErrors = errors.items?.[index];

                return (
                  <div
                    key={field.id}
                    className="border-line grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_7rem_2.25rem] sm:items-start sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b sm:px-0 sm:pb-3 sm:last:border-b-0 sm:last:pb-0"
                  >
                    <div>
                      <Label
                        htmlFor={`desc-${index}`}
                        className="text-muted mb-1.5 text-xs sm:sr-only"
                      >
                        {t('items.description')}
                      </Label>
                      <Input
                        id={`desc-${index}`}
                        placeholder={t('items.descriptionPlaceholder')}
                        aria-invalid={!!rowErrors?.description}
                        className={fieldClass}
                        {...register(`items.${index}.description`)}
                      />
                      <FieldError message={rowErrors?.description?.message} />
                    </div>

                    <div>
                      <Label
                        htmlFor={`qty-${index}`}
                        className="text-muted mb-1.5 text-xs sm:sr-only"
                      >
                        {t('items.quantity')}
                      </Label>
                      <Input
                        id={`qty-${index}`}
                        inputMode="decimal"
                        autoComplete="off"
                        aria-invalid={!!rowErrors?.quantity}
                        className={cn(fieldClass, 'tabular-nums')}
                        {...register(`items.${index}.quantity`)}
                      />
                      <FieldError message={rowErrors?.quantity?.message} />
                    </div>

                    <div>
                      <Label
                        htmlFor={`price-${index}`}
                        className="text-muted mb-1.5 text-xs sm:sr-only"
                      >
                        {t('items.price')}
                      </Label>
                      <Input
                        id={`price-${index}`}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        aria-invalid={!!rowErrors?.unitPrice}
                        className={cn(fieldClass, 'tabular-nums')}
                        {...register(`items.${index}.unitPrice`)}
                      />
                      <FieldError message={rowErrors?.unitPrice?.message} />
                    </div>

                    <div>
                      <span className="text-muted mb-1.5 block text-xs sm:sr-only">
                        {t('items.total')}
                      </span>
                      <div className="text-ink flex h-11 items-center text-sm font-bold whitespace-nowrap tabular-nums">
                        {money(row ? lineAmount(row) : 0)}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      aria-label={t('items.remove', { index: index + 1 })}
                      className="text-muted hover:text-danger hover:bg-danger-soft h-11 w-9 justify-self-end sm:justify-self-auto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append(EMPTY_ITEM)}
              className={cn(outlineBtn, 'mt-4')}
            >
              <Plus className="size-4" />
              {t('items.add')}
            </Button>
          </Section>

          {/* ملاحظات */}
          <Section title={t('notes.title')}>
            <Textarea
              rows={3}
              placeholder={t('notes.placeholder')}
              aria-label={t('notes.title')}
              aria-invalid={!!errors.notes}
              className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/15 resize-none focus-visible:ring-2"
              {...register('notes')}
            />
            <FieldError message={errors.notes?.message} />
          </Section>
        </div>

        {/* الملخص */}
        <aside className="lg:sticky lg:top-6">
          <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
            <h2 className="text-ink text-base font-extrabold">
              {t('summary.title')}
            </h2>
            {customerName && (
              <p className="text-muted mt-1 truncate text-xs">{customerName}</p>
            )}

            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label={t('summary.subtotal')}
                value={money(totals.subtotal)}
              />
              <SummaryRow
                label={t('summary.vat', { rate: vatRate })}
                value={money(totals.vat)}
              />

              <div className="border-line border-t pt-4">
                <div className="rounded-btn bg-brand-soft px-3 py-3">
                  <SummaryRow
                    label={t('summary.total')}
                    value={money(totals.total)}
                    strong
                  />
                </div>
              </div>

              {dueDate && (
                <div className="border-line border-t pt-3">
                  <SummaryRow
                    label={t('summary.dueDate')}
                    value={formatDate(dueDate)}
                  />
                </div>
              )}
            </dl>

            <div className="mt-5 space-y-2.5">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={submit('send')}
                className="rounded-btn bg-brand hover:bg-brand/90 h-11 w-full text-sm font-bold text-white"
              >
                {t('actions.saveSend')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={submit('draft')}
                className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 w-full text-sm font-bold"
              >
                {t('actions.saveDraft')}
              </Button>
              <Link
                href="/invoices"
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'text-muted hover:text-ink h-11 w-full text-sm font-bold',
                )}
              >
                {t('actions.cancel')}
              </Link>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
