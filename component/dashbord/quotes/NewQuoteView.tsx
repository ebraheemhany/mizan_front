// components/quotes/NewQuoteView.tsx
'use client';

import { useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { ar, enUS } from 'react-day-picker/locale';
import { ArrowLeft, CalendarDays, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FieldError, FormSection } from '@/component/form-parts';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/navigation';
import { rtlLocales } from '@/i18n/routing';
import { ApiError } from '@/lib/api/client';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { useCreateCustomer, useCustomers } from '@/lib/customers/hooks';
import { useDate } from '@/lib/data';
import { addDaysIso, deviceCairoToday, fromIso, toIso } from '@/lib/iso-date';
import { useMoney } from '@/lib/money';
import {
  toUiQuoteDetail,
  useCreateQuote,
  useQuote,
  useQuoteAction,
  useUpdateQuote,
  VALIDITY_DAYS,
  type ApiQuoteDetail,
  type QuoteDetail,
  type QuoteInput,
} from '@/lib/quotes/hooks';
import { useSettings } from '@/lib/settings/hooks';
import { cn } from '@/lib/utils';
import { calcTotals, parseNumber, VAT_RATE } from '@/lib/validations/invoice';
import { createQuoteSchema, type QuoteFormValues } from '@/lib/validations/quote';
import CustomerCombobox, { type CustomerOption } from '@/component/dashbord/invoices/CustomerCombobox';
import LineItemsSection from '@/component/dashbord/invoices/LineItemsSection';
import { useQuoteErrorMessage } from './useQuoteActions';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-10 gap-2 text-xs font-bold';
const emptyItem = { description: '', quantity: '1', unitPrice: '', productId: null };

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn('text-body', strong && 'text-ink text-base font-extrabold')}>{label}</dt>
      <dd className={cn('text-ink font-bold tabular-nums', strong && 'text-brand-deep text-xl font-extrabold')}>
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

/** A new quote, or (with `editNumber`) a draft to edit. */
export default function NewQuoteView({ editNumber }: { editNumber?: number }) {
  const t = useTranslations('QuoteForm');
  const tApi = useTranslations('QuotesApi');
  const tApiErrors = useTranslations('ApiErrors');
  const errorMessage = useQuoteErrorMessage();
  const user = useSession();
  const settings = useSettings();
  // Customers to choose from (first 100 by name).
  const customers = useCustomers({ status: 'all', balance: 'all', sort: 'name', page: 1, pageSize: 100 });
  const draft = useQuote(editNumber ?? 0, { enabled: editNumber !== undefined });
  // The draft the form was filled from. Kept once the form shows: "save and send" puts the
  // now-sent quote in the cache, which must not swap the form for "no longer a draft"
  // while the page moves on to the quote.
  const [formQuote, setFormQuote] = useState<QuoteDetail | null>(null);

  if (!can(user.role, 'quotes')) {
    return <p className="text-muted text-sm">{tApiErrors('FORBIDDEN')}</p>;
  }
  if ((editNumber !== undefined && !formQuote && draft.isPending) || settings.isPending || customers.isPending) {
    return <Loading />;
  }
  if (
    editNumber !== undefined &&
    !formQuote &&
    draft.isError &&
    !(draft.error instanceof ApiError && draft.error.status === 404)
  ) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <p className="text-danger text-sm font-semibold">{errorMessage(draft.error)}</p>
        <Button variant="outline" className={outlineBtn} onClick={() => draft.refetch()}>
          {tApi('retry')}
        </Button>
      </div>
    );
  }

  const editQuote =
    formQuote ?? (editNumber !== undefined && draft.data ? toUiQuoteDetail(draft.data) : undefined);
  if (editNumber !== undefined && editQuote?.status !== 'draft') {
    return (
      <div className="space-y-3">
        <p className="text-muted text-sm">{t('draftUnavailable')}</p>
        <Link
          href={editQuote ? `/quotes/${editQuote.number}` : '/quotes'}
          className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
        >
          {t('back')}
        </Link>
      </div>
    );
  }

  // Updating state while rendering (React re-renders right away), not in an effect.
  if (editQuote && !formQuote) setFormQuote(editQuote);

  const vatEnabled = settings.data?.taxes.vatEnabled ?? true;
  const options = customers.data?.items.map((c) => ({ id: c.id, name: c.name, city: c.city ?? '' })) ?? [];
  // The draft's customer may not be among the first 100: add it so the picker shows it.
  if (editQuote?.customerId && !options.some((c) => c.id === editQuote.customerId)) {
    options.push({ id: editQuote.customerId, name: editQuote.customer, city: '' });
  }

  return (
    <QuoteForm
      key={editQuote?.id ?? 'new'}
      editQuote={editQuote}
      customers={options}
      vatRate={vatEnabled ? VAT_RATE : 0}
    />
  );
}

function QuoteForm({
  editQuote,
  customers,
  vatRate,
}: {
  editQuote?: QuoteDetail;
  customers: CustomerOption[];
  /** From the settings: 14, or 0 when VAT is off (preview only; the server does the math). */
  vatRate: number;
}) {
  const t = useTranslations('QuoteForm');
  const invoiceT = useTranslations('InvoiceForm');
  const locale = useLocale();
  const router = useRouter();
  const user = useSession();
  const money = useMoney();
  const formatDate = useDate();
  const errorMessage = useQuoteErrorMessage();
  const isRtl = rtlLocales.includes(locale);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const quoteAction = useQuoteAction();
  const createCustomer = useCreateCustomer();
  const [dateOpen, setDateOpen] = useState<'issueDate' | 'validUntil' | null>(null);
  // Customers added from this page are added to the options too.
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(customers);

  const schema = useMemo(
    () =>
      createQuoteSchema({
        customerRequired: invoiceT('errors.customerRequired'),
        issueDateRequired: t('errors.issueDateRequired'),
        validUntilRequired: t('errors.validUntilRequired'),
        validUntilAfterIssue: t('errors.validUntilAfterIssue'),
        descriptionRequired: invoiceT('errors.descriptionRequired'),
        quantityInvalid: invoiceT('errors.quantityInvalid'),
        priceInvalid: invoiceT('errors.priceInvalid'),
        notesMax: invoiceT('errors.notesMax'),
      }),
    [invoiceT, t],
  );

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: editQuote
      ? {
          customerId: editQuote.customerId ?? '',
          issueDate: editQuote.issueDate,
          validUntil: editQuote.validUntil,
          items: editQuote.lines.length
            ? editQuote.lines.map((line) => ({
                description: line.title,
                quantity: String(line.quantity),
                unitPrice: String(line.unitPrice),
                productId: line.productId,
              }))
            : [emptyItem],
          notes: editQuote.note,
        }
      : (() => {
          // Today in Cairo by this device's clock; valid for two weeks by default.
          const today = deviceCairoToday();
          return {
            customerId: '',
            issueDate: today,
            validUntil: addDaysIso(today, VALIDITY_DAYS),
            items: [emptyItem],
            notes: '',
          };
        })(),
  });
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const items = useWatch({ control, name: 'items' }) ?? [];
  const validUntil = useWatch({ control, name: 'validUntil' });
  const customerId = useWatch({ control, name: 'customerId' });
  const totals = calcTotals(items, vatRate);
  const customerName = customerOptions.find((customer) => customer.id === customerId)?.name;

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

  function showError(error: unknown) {
    if (!(error instanceof ApiError)) {
      toast.error(errorMessage(error));
      return;
    }
    if (error.code === 'INVALID_CUSTOMER') {
      setError('customerId', { message: invoiceT('errors.customerRequired') }, { shouldFocus: true });
    } else if (error.code === 'FUTURE_ISSUE_DATE') {
      // Sending with a date after today: say so on the date field.
      setError('issueDate', { message: errorMessage(error) });
    } else if (error.code === 'QUOTE_VALIDITY_PASSED') {
      // Sending a quote whose validity has already run out.
      setError('validUntil', { message: errorMessage(error) }, { shouldFocus: true });
    } else if (error.code === 'VALIDATION_ERROR' && error.details?.fieldErrors?.validUntil) {
      setError('validUntil', { message: t('errors.validUntilAfterIssue') });
    } else {
      toast.error(errorMessage(error));
    }
  }

  const submit = (mode: 'draft' | 'send') =>
    handleSubmit(async (values) => {
      const input: QuoteInput = {
        customerId: values.customerId,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        // Numbers as typed (commas and spaces removed); the backend does the math.
        items: values.items.map((item) => ({
          description: item.description.trim(),
          quantity: String(parseNumber(item.quantity)),
          unitPrice: String(parseNumber(item.unitPrice)),
          productId: item.productId ?? null,
        })),
        notes: values.notes.trim(),
      };

      let saved: ApiQuoteDetail;
      try {
        saved = editQuote
          ? await updateQuote.mutateAsync({ ref: editQuote.id, input })
          : await createQuote.mutateAsync({ ...input, send: mode === 'send' });
      } catch (error) {
        showError(error);
        return;
      }

      // An edited draft is saved first, then sent: if sending fails, the changes are kept.
      if (editQuote && mode === 'send') {
        try {
          saved = await quoteAction.mutateAsync({ kind: 'send', ref: saved.id });
        } catch (error) {
          toast.success(t('toasts.draftUpdated'));
          showError(error);
          return;
        }
      }

      toast.success(
        t(mode === 'send' ? 'toasts.sent' : editQuote ? 'toasts.draftUpdated' : 'toasts.draftSaved'),
      );
      router.push(`/quotes/${saved.number}`);
    });

  function dateField(name: 'issueDate' | 'validUntil', label: string) {
    return (
      <div>
        <Label htmlFor={name} className="text-ink mb-2 text-sm font-bold">
          {label}
        </Label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const selected = field.value ? fromIso(field.value) : undefined;
            const hasError = !!errors[name];

            return (
              <Popover open={dateOpen === name} onOpenChange={(open) => setDateOpen(open ? name : null)}>
                <PopoverTrigger
                  id={name}
                  aria-invalid={hasError}
                  className={cn(
                    'rounded-btn bg-surface flex h-11 w-full items-center gap-3 border px-3 text-start text-sm transition-colors outline-none focus-visible:ring-2',
                    hasError
                      ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/15'
                      : 'border-line-strong hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15',
                  )}
                >
                  <span className="bg-brand-soft flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <CalendarDays className="text-brand size-4" />
                  </span>
                  <span
                    className={cn('min-w-0 flex-1 truncate font-semibold', field.value ? 'text-ink' : 'text-muted')}
                  >
                    {field.value ? formatDate(field.value) : t('details.pickDate')}
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
                    onSelect={(date) => {
                      if (!date) return;
                      field.onChange(toIso(date));
                      setDateOpen(null);
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
        <FieldError message={errors[name]?.message} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          editQuote ? (
            <>
              {t('editTitle')}{' '}
              <span dir="ltr" className="inline-block">
                {editQuote.displayNumber}
              </span>
            </>
          ) : (
            t('title')
          )
        }
        description={editQuote ? t('editSubtitle') : t('subtitle')}
        actions={
          <Link
            href={editQuote ? `/quotes/${editQuote.number}` : '/quotes'}
            className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('back')}
          </Link>
        }
      />

      <FormProvider {...form}>
        <form
          onSubmit={(event) => event.preventDefault()}
          noValidate
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="min-w-0 space-y-5">
            <FormSection title={t('details.title')}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="customer" className="text-ink mb-2 text-sm font-bold">
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
                        searchPlaceholder={invoiceT('details.customerSearch')}
                        emptyText={invoiceT('details.customerEmpty')}
                        addCustomerText={invoiceT('details.addCustomer')}
                        addCustomerDescription={invoiceT('details.addCustomerNote')}
                        customerNameLabel={invoiceT('details.customerName')}
                        customerNamePlaceholder={invoiceT('details.customerNamePlaceholder')}
                        customerCityLabel={invoiceT('details.customerCity')}
                        customerCityPlaceholder={invoiceT('details.customerCityPlaceholder')}
                        customerNameRequired={invoiceT('errors.customerNameRequired')}
                        createCustomerText={invoiceT('details.createCustomer')}
                        cancelText={invoiceT('actions.cancel')}
                        invalid={!!errors.customerId}
                        onChange={field.onChange}
                        onAddCustomer={addCustomer}
                      />
                    )}
                  />
                  <FieldError message={errors.customerId?.message} />
                </div>

                {dateField('issueDate', t('details.issueDate'))}
                {dateField('validUntil', t('details.validUntil'))}
              </div>
            </FormSection>

            <LineItemsSection namespace="QuoteForm.items" />

            <FormSection title={t('notes.title')}>
              <Textarea
                rows={3}
                placeholder={t('notes.placeholder')}
                aria-label={t('notes.title')}
                aria-invalid={!!errors.notes}
                className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/15 resize-none focus-visible:ring-2"
                {...register('notes')}
              />
              <FieldError message={errors.notes?.message} />
            </FormSection>
          </div>

          <aside className="lg:sticky lg:top-6">
            <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
              <h2 className="text-ink text-base font-extrabold">{invoiceT('summary.title')}</h2>
              {customerName && <p className="text-muted mt-1 truncate text-xs">{customerName}</p>}

              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow label={invoiceT('summary.subtotal')} value={money(totals.subtotal)} />
                <SummaryRow label={invoiceT('summary.vat', { rate: vatRate })} value={money(totals.vat)} />
                <div className="border-line border-t pt-4">
                  <div className="rounded-btn bg-brand-soft px-3 py-3">
                    <SummaryRow label={invoiceT('summary.total')} value={money(totals.total)} strong />
                  </div>
                </div>
                {validUntil && (
                  <div className="border-line border-t pt-3">
                    <SummaryRow label={t('details.validUntil')} value={formatDate(validUntil)} />
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
                  {t(editQuote ? 'actions.updateSend' : 'actions.saveSend')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={submit('draft')}
                  className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 w-full text-sm font-bold"
                >
                  {t(editQuote ? 'actions.updateDraft' : 'actions.saveDraft')}
                </Button>
                <Link
                  href={editQuote ? `/quotes/${editQuote.number}` : '/quotes'}
                  className={cn(buttonVariants({ variant: 'ghost' }), 'text-muted hover:text-ink h-11 w-full text-sm font-bold')}
                >
                  {invoiceT('actions.cancel')}
                </Link>
              </div>
            </section>
          </aside>
        </form>
      </FormProvider>
    </div>
  );
}
