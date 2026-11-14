// component/dashbord/expenses/QuickAddCard.tsx
'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DateField from '@/component/DateField';
import { EXPENSES_TODAY, type ExpenseCategory } from '@/lib/mock/expenses';
import {
  quickExpenseSchema,
  type QuickExpenseValues,
} from '@/lib/validations/expenses';

const CATEGORIES: ExpenseCategory[] = [
  'salaries',
  'rent',
  'purchases',
  'marketing',
  'utilities',
  'software',
];

const inputClass =
  'rounded-btn border-line-strong bg-surface text-ink hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 text-xs transition-colors focus-visible:ring-2';
const label = 'text-ink-2 mb-1.5 block text-xs font-bold';

export default function QuickAddCard({
  onAdd,
}: {
  onAdd: (values: QuickExpenseValues) => void;
}) {
  const t = useTranslations('Expenses.quickAdd');
  const fileRef = useRef<HTMLInputElement>(null);
  // TODO: رفع صورة الإيصال لما نربط الـ API، دلوقتي بنعرض الاسم بس
  const [receiptName, setReceiptName] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickExpenseValues>({
    resolver: zodResolver(quickExpenseSchema),
    defaultValues: {
      title: '',
      amount: '',
      category: 'purchases',
      date: EXPENSES_TODAY,
    },
  });

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  function submit(values: QuickExpenseValues) {
    onAdd(values);
    reset({ ...values, title: '', amount: '' });
    setReceiptName(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="rounded-card border-line bg-surface space-y-4 border p-5 shadow-sm"
    >
      <h2 className="text-ink text-sm font-extrabold">{t('title')}</h2>

      <div>
        <label htmlFor="qa-title" className={label}>
          {t('fields.title')}
        </label>
        <Input
          id="qa-title"
          placeholder={t('placeholders.title')}
          className={inputClass}
          {...register('title')}
        />
        {error(errors.title?.message)}
      </div>

      <div>
        <label htmlFor="qa-amount" className={label}>
          {t('fields.amount')}
        </label>
        <Input
          id="qa-amount"
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
        <label id="qa-category-label" className={label}>
          {t('fields.category')}
        </label>
        <Controller
          name="category"
          control={control}
          render={({ field: categoryField }) => (
            <Select
              value={categoryField.value}
              onValueChange={categoryField.onChange}
            >
              <SelectTrigger
                id="qa-category"
                aria-labelledby="qa-category-label"
                ref={categoryField.ref}
                onBlur={categoryField.onBlur}
                className="rounded-btn border-line-strong bg-surface text-ink hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 w-full text-xs font-semibold shadow-sm transition-colors focus-visible:ring-2"
              >
                <SelectValue>
                  {t(`categories.${categoryField.value}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-line bg-surface text-ink rounded-xl shadow-lg">
                {CATEGORIES.map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                  >
                    {t(`categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <label htmlFor="qa-date" className={label}>
          {t('fields.date')}
        </label>
        <Controller
          name="date"
          control={control}
          render={({ field: dateField }) => (
            <DateField
              id="qa-date"
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setReceiptName(e.target.files?.[0]?.name ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="border-line-strong text-muted hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15 rounded-btn flex h-14 w-full items-center justify-center gap-2 border border-dashed px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-2"
        >
          <ImagePlus className="size-4 shrink-0" />
          <span className="truncate">{receiptName ?? t('receipt')}</span>
        </button>
      </div>

      <Button
        type="submit"
        className="rounded-btn bg-brand hover:bg-brand/90 h-10 w-full text-xs font-bold text-white"
      >
        {t('save')}
      </Button>
    </form>
  );
}
