// component/dashbord/payments/RecordPaymentCard.tsx
'use client';

import { useEffect } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DateField from '@/component/DateField';
import { useMoney } from '@/lib/money';
import { toIso } from '@/lib/iso-date';
import type { OpenInvoice } from '@/lib/mock/payments';
import { RECEIVING_ACCOUNTS } from '@/lib/payments/constants';
import {
  paymentSchema,
  type PaymentFormValues,
} from '@/lib/validations/payments';
import { METHODS } from './PaymentsToolbar';

const inputClass =
  'rounded-btn border-line-strong bg-surface text-ink hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 text-xs transition-colors focus-visible:ring-2';
const label = 'text-ink-2 mb-1.5 block text-xs font-bold';

export default function RecordPaymentCard({
  invoices,
  onAdd,
}: {
  invoices: OpenInvoice[];
  /** May be async: the form waits for it before allowing another submit. */
  onAdd: (values: PaymentFormValues, invoice: OpenInvoice) => void | Promise<void>;
}) {
  const t = useTranslations('Payments.form');
  const format = useFormatter();
  const money = useMoney();

  const first = invoices[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice: first ? String(first.number) : '',
      amount: first ? String(first.balance) : '',
      // Today on the user's device.
      date: toIso(new Date()),
      method: 'bankTransfer',
      account: 'bank',
      reference: '',
      note: '',
    },
  });

  const invoiceValue = useWatch({ control, name: 'invoice' });
  const account = useWatch({ control, name: 'account' });

  // اختيار فاتورة تانية يعبّي المبلغ برصيدها
  useEffect(() => {
    const inv = invoices.find((i) => String(i.number) === invoiceValue);
    if (inv) setValue('amount', String(inv.balance));
  }, [invoiceValue, invoices, setValue]);

  // لما قائمة الفواتير تتغير (بعد دفعة أو تراجع) نبدأ من أول فاتورة
  useEffect(() => {
    const head = invoices[0];
    reset({
      ...getValues(),
      invoice: head ? String(head.number) : '',
      amount: head ? String(head.balance) : '',
      reference: '',
      note: '',
    });
  }, [invoices, reset, getValues]);

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  async function submit(values: PaymentFormValues) {
    const inv = invoices.find((i) => String(i.number) === values.invoice);
    if (!inv) return;

    if (Number(values.amount) > inv.balance) {
      setError('amount', { message: 'amountTooHigh' });
      return;
    }
    await onAdd(values, inv);
  }

  const num = (v: number) =>
    format.number(v, { useGrouping: false, numberingSystem: 'latn' });

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="rounded-card border-line bg-surface space-y-4 border p-5 shadow-sm"
    >
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      {invoices.length === 0 ? (
        <p className="text-muted py-6 text-center text-xs">{t('noInvoices')}</p>
      ) : (
        <>
          <div>
            <label id="pay-invoice-label" className={label}>
              {t('fields.invoice')}
            </label>
            <Controller
              name="invoice"
              control={control}
              render={({ field: invoiceField }) => (
                <Select
                  value={invoiceField.value}
                  onValueChange={(value) => {
                    if (value) invoiceField.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="pay-invoice"
                    aria-labelledby="pay-invoice-label"
                    ref={invoiceField.ref}
                    onBlur={invoiceField.onBlur}
                    className={`${inputClass} w-full font-semibold shadow-sm`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-line bg-surface text-ink rounded-xl shadow-lg">
                    {invoices.map((i) => (
                      <SelectItem
                        key={i.number}
                        value={String(i.number)}
                        className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        #{num(i.number)} — {i.customer} ({money(i.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {error(errors.invoice?.message)}
          </div>

          <div>
            <label htmlFor="pay-amount" className={label}>
              {t('fields.amount')}
            </label>
            <Input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className={inputClass}
              {...register('amount')}
            />
            {error(errors.amount?.message)}
          </div>

          <div>
            <label htmlFor="pay-date" className={label}>
              {t('fields.date')}
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field: dateField }) => (
                <DateField
                  id="pay-date"
                  value={dateField.value}
                  onChange={dateField.onChange}
                  placeholder={t('fields.date')}
                  invalid={!!errors.date}
                />
              )}
            />
            {error(errors.date?.message)}
          </div>

          <div>
            <label id="pay-method-label" className={label}>
              {t('fields.method')}
            </label>
            <Controller
              name="method"
              control={control}
              render={({ field: methodField }) => (
                <Select
                  value={methodField.value}
                  onValueChange={(value) => {
                    if (value) methodField.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="pay-method"
                    aria-labelledby="pay-method-label"
                    ref={methodField.ref}
                    onBlur={methodField.onBlur}
                    className={`${inputClass} w-full font-semibold shadow-sm`}
                  >
                    <SelectValue>
                      {t(`methods.${methodField.value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-line bg-surface text-ink rounded-xl shadow-lg">
                    {METHODS.map((method) => (
                      <SelectItem
                        key={method}
                        value={method}
                        className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        {t(`methods.${method}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <label id="pay-account-label" className={label}>
              {t('fields.account')}
            </label>
            <Controller
              name="account"
              control={control}
              render={({ field: accountField }) => (
                <Select
                  value={accountField.value}
                  onValueChange={(value) => {
                    if (value) accountField.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="pay-account"
                    aria-labelledby="pay-account-label"
                    ref={accountField.ref}
                    onBlur={accountField.onBlur}
                    className={`${inputClass} w-full font-semibold shadow-sm`}
                  >
                    <SelectValue>
                      {t(`accounts.${accountField.value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-line bg-surface text-ink rounded-xl shadow-lg">
                    {RECEIVING_ACCOUNTS.map((receivingAccount) => (
                      <SelectItem
                        key={receivingAccount}
                        value={receivingAccount}
                        className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        {t(`accounts.${receivingAccount}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <label htmlFor="pay-reference" className={label}>
              {t('fields.reference')}
            </label>
            <Input
              id="pay-reference"
              placeholder={t('placeholders.reference')}
              className={inputClass}
              {...register('reference')}
            />
          </div>

          <div>
            <label htmlFor="pay-note" className={label}>
              {t('fields.note')}
            </label>
            <Textarea
              id="pay-note"
              rows={3}
              className={`${inputClass} h-auto min-h-20 resize-none px-3 py-2.5`}
              {...register('note')}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-btn bg-brand hover:bg-brand/90 h-10 w-full text-xs font-bold text-white"
          >
            {t('save')}
          </Button>

          <p className="text-muted text-center text-[11px] leading-5">
            {t('entryNote', { account: t(`accounts.${account}`) })}
          </p>
        </>
      )}
    </form>
  );
}
