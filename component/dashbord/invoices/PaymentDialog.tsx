// components/invoices/PaymentDialog.tsx
'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  CreditCard,
  HandCoins,
  Landmark,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ar, enUS } from 'react-day-picker/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { rtlLocales } from '@/i18n/routing';

import { MOCK_NOW } from '@/lib/mock/invoices';
import { useMoney, useMoneyParts } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  createPaymentSchema,
  parseAmount,
  PAYMENT_METHODS,
  type PaymentMethod,
  type PaymentValues,
} from '@/lib/validations/payment';
import { useDate } from '@/lib/data';

export type PaymentInput = {
  amount: number;
  date: string;
  method: PaymentMethod;
  note: string;
};

const METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  bank: Landmark,
  cash: Banknote,
  card: CreditCard,
};

const fieldClass = 'rounded-btn border-line-strong bg-surface h-11';

function toIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
      {message}
    </p>
  );
}

function PaymentForm({
  remaining,
  onSubmit,
  onCancel,
}: {
  remaining: number;
  onSubmit: (input: PaymentInput) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('InvoiceDetail.paymentDialog');
  const tMethods = useTranslations('InvoiceDetail.payments.methods');
  const locale = useLocale();
  const isRtl = rtlLocales.includes(locale);
  const money = useMoney();
  const moneyParts = useMoneyParts();
  const formatDate = useDate();
  const { symbol } = moneyParts(remaining);
  const [dateOpen, setDateOpen] = useState(false);

  // TODO: التاريخ الحقيقي لما نربط الـ API
  const todayIso = MOCK_NOW.toISOString().slice(0, 10);

  const schema = useMemo(
    () =>
      createPaymentSchema(
        {
          amountRequired: t('errors.amountRequired'),
          amountInvalid: t('errors.amountInvalid'),
          amountMax: t('errors.amountMax'),
          dateRequired: t('errors.dateRequired'),
          noteMax: t('errors.noteMax'),
        },
        remaining,
      ),
    [t, remaining],
  );

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: String(remaining),
      date: todayIso,
      method: 'bank',
      note: '',
    },
  });

  const typed = parseAmount(watch('amount') ?? '');
  const validTyped = Number.isFinite(typed) && typed > 0 && typed <= remaining;
  const after = validTyped ? remaining - typed : remaining;

  const setAmount = (value: number) =>
    setValue('amount', String(value), {
      shouldValidate: true,
      shouldDirty: true,
    });

  function submit(v: PaymentValues) {
    onSubmit({
      amount: parseAmount(v.amount),
      date: v.date,
      method: v.method,
      note: v.note.trim(),
    });
  }

  const chip =
    'border-line-strong bg-surface text-ink-2 hover:bg-canvas rounded-full border px-3 py-1 text-xs font-bold transition-colors';

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="space-y-5 px-6 py-5">
        {/* ملخص: قبل وبعد */}
        <div className="border-line bg-canvas/60 divide-line grid grid-cols-2 divide-x overflow-hidden rounded-xl border divide-x-reverse">
          <div className="px-4 py-3">
            <p className="text-muted text-xs font-semibold">
              {t('remainingNow')}
            </p>
            <p className="text-ink mt-1 text-lg font-extrabold tabular-nums">
              {money(remaining)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-muted text-xs font-semibold">
              {t('remainingAfter')}
            </p>
            <p
              className={cn(
                'mt-1 text-lg font-extrabold tabular-nums transition-colors',
                validTyped && after === 0 ? 'text-brand' : 'text-ink',
              )}
            >
              {money(after)}
            </p>
            {validTyped && after === 0 && (
              <p className="text-brand-deep mt-0.5 text-[11px] font-bold">
                {t('paidInFull')}
              </p>
            )}
          </div>
        </div>

        {/* المبلغ */}
        <div>
          <Label htmlFor="amount" className="text-ink mb-2 text-sm font-bold">
            {t('amount')}
          </Label>
          <div className="relative">
            <Input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              aria-invalid={!!errors.amount}
              className="rounded-btn border-line-strong bg-surface focus-visible:border-brand focus-visible:ring-brand/20 h-14 pe-16 text-2xl font-extrabold tabular-nums"
              {...register('amount')}
            />
            <span className="text-muted pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold">
              {symbol}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              className={chip}
              onClick={() => setAmount(remaining)}
            >
              {t('payFull')}
            </button>
            {remaining > 1 && (
              <button
                type="button"
                className={chip}
                onClick={() => setAmount(Math.round(remaining / 2))}
              >
                {t('payHalf')}
              </button>
            )}
          </div>
          <FieldError message={errors.amount?.message} />
        </div>

        {/* التاريخ */}
        <div>
          <Label htmlFor="date" className="text-ink mb-2 text-sm font-bold">
            {t('date')}
          </Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => {
              const selected = field.value ? fromIso(field.value) : undefined;

              return (
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger
                    id="date"
                    aria-invalid={!!errors.date}
                    className={cn(
                      fieldClass,
                      'text-ink hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/20 aria-invalid:border-danger aria-invalid:ring-danger/10 flex w-full items-center gap-3 border px-3 text-start text-sm font-semibold transition-colors outline-none focus-visible:ring-2 aria-invalid:ring-2',
                    )}
                  >
                    <span className="bg-brand-soft text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <CalendarDays className="size-4" />
                    </span>
                    <span className="flex-1">
                      {field.value ? formatDate(field.value) : t('pickDate')}
                    </span>
                    <ChevronDown className="text-muted size-4 shrink-0" />
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="border-line bg-surface w-auto rounded-xl border p-0 shadow-lg"
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
                      disabled={{ after: fromIso(todayIso) }}
                      locale={isRtl ? ar : enUS}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="text-ink [&_[data-selected-single=true]]:bg-brand [&_[data-selected-single=true]]:text-white [&_[data-selected-single=true]]:hover:bg-brand-deep [&_[data-today=true]:not([data-selected=true])]:bg-brand-soft [&_[data-today=true]:not([data-selected=true])]:text-brand-deep"
                    />
                  </PopoverContent>
                </Popover>
              );
            }}
          />
          <FieldError message={errors.date?.message} />
        </div>

        {/* طريقة الدفع */}
        <div>
          <p id="method-label" className="text-ink mb-2 text-sm font-bold">
            {t('method')}
          </p>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-labelledby="method-label"
                className="grid grid-cols-3 gap-2.5"
              >
                {PAYMENT_METHODS.map((m) => {
                  const Icon = METHOD_ICONS[m];
                  const selected = field.value === m;

                  return (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => field.onChange(m)}
                      className={cn(
                        'rounded-btn focus-visible:ring-brand/30 flex h-[72px] flex-col items-center justify-center gap-1.5 border text-xs font-bold transition-colors outline-none focus-visible:ring-2',
                        selected
                          ? 'border-brand bg-brand-soft text-brand-deep'
                          : 'border-line-strong bg-surface text-ink-2 hover:bg-canvas',
                      )}
                    >
                      <Icon className="size-5" />
                      {tMethods(m)}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* ملاحظة */}
        <div>
          <Label htmlFor="note" className="text-ink mb-2 text-sm font-bold">
            {t('note')}
          </Label>
          <Textarea
            id="note"
            rows={2}
            placeholder={t('notePlaceholder')}
            aria-invalid={!!errors.note}
            className="rounded-btn border-line-strong bg-surface resize-none"
            {...register('note')}
          />
          <FieldError message={errors.note?.message} />
        </div>
      </div>

      <DialogFooter className="border-line bg-canvas gap-2 border-t px-6 py-4 sm:gap-2">
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
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentDialog({
  open,
  onOpenChange,
  number,
  customer,
  remaining,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  number: number;
  customer: string;
  remaining: number;
  onSubmit: (input: PaymentInput) => void;
}) {
  const t = useTranslations('InvoiceDetail.paymentDialog');

  // الفورم بيتعمل من الأول كل ما الـ Dialog يتفتح، فالقيم القديمة بتتمسح لوحدها
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-card border-line bg-surface text-ink shadow-float max-h-[90dvh] gap-0 overflow-x-hidden overflow-y-auto border p-0 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] sm:max-w-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand"
      >
        <div className="border-line bg-brand-soft/60 relative flex items-center gap-3.5 border-b px-6 py-5">
          <span className="bg-surface text-brand ring-brand/10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
            <HandCoins className="size-5" />
          </span>

          <DialogHeader className="min-w-0 gap-0.5 pe-8 text-start">
            <DialogTitle className="text-ink text-lg font-extrabold">
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-muted truncate text-xs">
              {t('description', { number: String(number), customer })}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className="text-muted hover:bg-surface hover:text-ink absolute end-4 top-4 rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <PaymentForm
          remaining={remaining}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
