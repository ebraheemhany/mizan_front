'use client';

import { useMemo, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { ar, enUS } from 'react-day-picker/locale';
import { ArrowLeft, CalendarDays, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { FieldError, FormSection } from '@/component/form-parts';
import PageHeader from '@/component/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/navigation';
import { rtlLocales } from '@/i18n/routing';
import { addDaysIso, fromIso, toIso } from '@/lib/iso-date';
import { CUSTOMERS } from '@/lib/mock/customers';
import { TODAY, VALIDITY_DAYS, type Quote } from '@/lib/mock/quotes';
import {
  calcTotals,
  parseNumber,
  VAT_RATE,
} from '@/lib/validations/invoice';
import {
  createQuoteSchema,
  type QuoteFormValues,
} from '@/lib/validations/quote';
import { useDate } from '@/lib/data';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import CustomerCombobox from '@/component/dashbord/invoices/CustomerCombobox';
import LineItemsSection from '@/component/dashbord/invoices/LineItemsSection';
import { useQuotes } from './QuotesProvider';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-10 gap-2 text-xs font-bold';
const customerOptions = CUSTOMERS.map((customer) => ({
  id: customer.id,
  name: customer.name,
  city: customer.city,
}));
const emptyItem = { description: '', quantity: '1', unitPrice: '' };

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

export default function NewQuoteView({
  editNumber,
}: {
  editNumber?: number;
}) {
  const t = useTranslations('QuoteForm');
  const { quotes, hydrated } = useQuotes();
  const editQuote = editNumber
    ? quotes.find((quote) => quote.number === editNumber)
    : undefined;

  if (editNumber && !hydrated) {
    return <p className="text-muted text-sm">{t('loading')}</p>;
  }

  if (editNumber && (!editQuote || editQuote.status !== 'draft')) {
    return <p className="text-muted text-sm">{t('draftUnavailable')}</p>;
  }

  return (
    <QuoteForm
      key={editQuote?.id ?? 'new'}
      editQuote={editQuote}
    />
  );
}

function QuoteForm({ editQuote }: { editQuote?: Quote }) {
  const t = useTranslations('QuoteForm');
  const invoiceT = useTranslations('InvoiceForm');
  const locale = useLocale();
  const router = useRouter();
  const { quotes, setQuotes } = useQuotes();
  const money = useMoney();
  const formatDate = useDate();
  const isRtl = rtlLocales.includes(locale);
  const [dateOpen, setDateOpen] = useState<'issueDate' | 'validUntil' | null>(
    null,
  );
  const [customerOptionsState, setCustomerOptionsState] = useState(() => {
    if (
      editQuote &&
      !customerOptions.some((customer) => customer.name === editQuote.customer)
    ) {
      return [
        ...customerOptions,
        {
          id: `quote-${editQuote.number}`,
          name: editQuote.customer,
          city: '',
        },
      ];
    }
    return customerOptions;
  });

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
    defaultValues: {
      customerId:
        customerOptionsState.find(
          (customer) => customer.name === editQuote?.customer,
        )?.id ?? '',
      issueDate: editQuote?.issueDate ?? TODAY,
      validUntil:
        editQuote?.validUntil ?? addDaysIso(TODAY, VALIDITY_DAYS),
      items: editQuote?.items?.length
        ? editQuote.items.map((item) => ({
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        : editQuote
          ? [
              {
                description: 'خدمات — بحسب الاتفاق',
                quantity: '1',
                unitPrice: String(
                  Math.round(editQuote.total / (1 + VAT_RATE / 100)),
                ),
              },
            ]
          : [emptyItem],
      notes: editQuote?.notes ?? '',
    },
  });
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = form;
  const items = form.watch('items') ?? [];
  const validUntil = form.watch('validUntil');
  const customerId = form.watch('customerId');
  const totals = calcTotals(items);
  const customerName = customerOptionsState.find(
    (customer) => customer.id === customerId,
  )?.name;

  function addCustomer(customer: { name: string; city: string }) {
    const id = `new-${crypto.randomUUID()}`;
    setCustomerOptionsState((options) => [...options, { id, ...customer }]);
    return id;
  }

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
              <Popover
                open={dateOpen === name}
                onOpenChange={(open) => setDateOpen(open ? name : null)}
              >
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
                  className="border-line w-auto rounded-card border bg-surface p-1.5 shadow-lg"
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

  const submit = (mode: 'draft' | 'send') =>
    handleSubmit((values) => {
      const number =
        editQuote?.number ??
        Math.max(0, ...quotes.map((quote) => quote.number)) + 1;
      const nextQuote: Quote = {
        ...editQuote,
        id: editQuote?.id ?? `q${number}`,
        number,
        customer:
          customerOptionsState.find(
            (customer) => customer.id === values.customerId,
          )?.name ?? '',
        total: calcTotals(values.items).total,
        status: mode === 'draft' ? 'draft' : 'sent',
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        items: values.items.map((item) => ({
          description: item.description.trim(),
          quantity: parseNumber(item.quantity),
          unitPrice: parseNumber(item.unitPrice),
        })),
        notes: values.notes.trim() || undefined,
        sentDate: mode === 'send' ? TODAY : editQuote?.sentDate,
        acceptedDate: undefined,
        rejectedDate: undefined,
      };

      setQuotes((list) =>
        editQuote
          ? list.map((quote) =>
              quote.id === editQuote.id ? nextQuote : quote,
            )
          : [nextQuote, ...list],
      );
      toast.success(
        t(
          editQuote
            ? mode === 'draft'
              ? 'toasts.draftUpdated'
              : 'toasts.sent'
            : mode === 'draft'
              ? 'toasts.draftSaved'
              : 'toasts.sent',
        ),
      );
      router.push('/quotes');
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title={editQuote ? t('editTitle') : t('title')}
        description={editQuote ? t('editSubtitle') : t('subtitle')}
        actions={
          <Link
            href="/quotes"
            className={cn(buttonVariants({ variant: 'outline' }), outlineBtn)}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('back')}
          </Link>
        }
      />

      <p className="bg-amber-50 text-amber-900 rounded-xl px-4 py-3 text-xs leading-5">
        {t('demoNotice')}
      </p>

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
                        options={customerOptionsState}
                        placeholder={t('details.customerPlaceholder')}
                        searchPlaceholder={invoiceT(
                          'details.customerSearch',
                        )}
                        emptyText={invoiceT('details.customerEmpty')}
                        addCustomerText={invoiceT('details.addCustomer')}
                        addCustomerDescription={invoiceT(
                          'details.addCustomerNote',
                        )}
                        customerNameLabel={invoiceT('details.customerName')}
                        customerNamePlaceholder={invoiceT(
                          'details.customerNamePlaceholder',
                        )}
                        customerCityLabel={invoiceT('details.customerCity')}
                        customerCityPlaceholder={invoiceT(
                          'details.customerCityPlaceholder',
                        )}
                        customerNameRequired={invoiceT(
                          'errors.customerNameRequired',
                        )}
                        createCustomerText={invoiceT(
                          'details.createCustomer',
                        )}
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
                className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 resize-none"
                {...register('notes')}
              />
              <FieldError message={errors.notes?.message} />
            </FormSection>
          </div>

          <aside className="lg:sticky lg:top-6">
            <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
              <h2 className="text-ink text-base font-extrabold">
                {invoiceT('summary.title')}
              </h2>
              {customerName && (
                <p className="text-muted mt-1 truncate text-xs">
                  {customerName}
                </p>
              )}

              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  label={invoiceT('summary.subtotal')}
                  value={money(totals.subtotal)}
                />
                <SummaryRow
                  label={invoiceT('summary.vat', { rate: VAT_RATE })}
                  value={money(totals.vat)}
                />
                <div className="border-line border-t pt-4">
                  <div className="rounded-btn bg-brand-soft px-3 py-3">
                    <SummaryRow
                      label={invoiceT('summary.total')}
                      value={money(totals.total)}
                      strong
                    />
                  </div>
                </div>
                {validUntil && (
                  <div className="border-line border-t pt-3">
                    <SummaryRow
                      label={t('details.validUntil')}
                      value={formatDate(validUntil)}
                    />
                  </div>
                )}
              </dl>

              <div className="mt-5 space-y-2.5">
                <Button
                  type="button"
                  onClick={submit('send')}
                  className="rounded-btn bg-brand hover:bg-brand/90 h-11 w-full text-sm font-bold text-white"
                >
                  {t(editQuote ? 'actions.updateSend' : 'actions.saveSend')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={submit('draft')}
                  className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 w-full text-sm font-bold"
                >
                  {t(editQuote ? 'actions.updateDraft' : 'actions.saveDraft')}
                </Button>
                <Link
                  href="/quotes"
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'text-muted hover:text-ink h-11 w-full text-sm font-bold',
                  )}
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
