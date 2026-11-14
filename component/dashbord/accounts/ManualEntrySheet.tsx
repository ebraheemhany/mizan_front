// component/dashbord/accounts/ManualEntrySheet.tsx
'use client';

import { useState } from 'react';
import { Controller, useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { BookOpenText, Check, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import {
  ACCOUNTS,
  ACCOUNTS_TODAY,
  type JournalEntry,
  type LineAccount,
} from '@/lib/mock/accounts';
import {
  manualEntrySchema,
  type ManualEntryValues,
} from '@/lib/validations/journal-entry';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type Props = {
  open: boolean;
  onClose: () => void;
  nextNumber: string;
  isClosed: (date: string) => boolean;
  onCreate: (entry: JournalEntry) => void;
};

const ACCOUNT_KEYS: LineAccount[] = [
  ...ACCOUNTS.map((a) => a.key),
  'utilities',
];

const emptyLine = { account: '', debit: '', credit: '' };

const fieldClass =
  'border-line-strong hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 w-full rounded-btn border bg-transparent px-3 text-xs outline-none transition-colors focus-visible:outline-none focus-visible:ring-2';

function AccountPicker({
  value,
  onChange,
  t,
  tNames,
}: {
  value: string;
  onChange: (value: string) => void;
  t: (key: 'account' | 'selectAccount') => string;
  tNames: (key: LineAccount) => string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? tNames(value as LineAccount) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t('account')}
        className={cn(
          fieldClass,
          'bg-surface text-start flex items-center justify-between gap-2',
          value ? 'text-ink' : 'text-muted',
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected || t('selectAccount')}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="border-line w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border bg-surface p-0 shadow-lg"
      >
        <Command className="rounded-xl bg-surface p-1.5">
          <CommandInput
            placeholder={t('selectAccount')}
            className="text-ink placeholder:text-muted"
          />
          <CommandList className="max-h-64 py-1">
            <CommandEmpty className="text-muted py-5 text-xs">
              {t('selectAccount')}
            </CommandEmpty>
            <CommandGroup>
              {ACCOUNT_KEYS.map((key) => (
                <CommandItem
                  key={key}
                  value={tNames(key)}
                  onSelect={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className="text-ink cursor-pointer"
                >
                  <span className="min-w-0 flex-1 truncate">{tNames(key)}</span>
                  {key === value && <Check className="text-brand size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ManualEntrySheet({
  open,
  onClose,
  nextNumber,
  isClosed,
  onCreate,
}: Props) {
  const t = useTranslations('Accounts.manual');
  const tNames = useTranslations('Accounts.names');
  const locale = useLocale();
  const format = useFormatter();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ManualEntryValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      date: ACCOUNTS_TODAY,
      description: '',
      lines: [emptyLine, emptyLine],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watched = useWatch({ control, name: 'lines' });

  const num = (n: number) => format.number(n, { numberingSystem: 'latn' });
  const toNum = (s: string) => Number(s) || 0;

  const debit = (watched ?? []).reduce((s, l) => s + toNum(l.debit), 0);
  const credit = (watched ?? []).reduce((s, l) => s + toNum(l.credit), 0);
  const diff = Math.round((debit - credit) * 100) / 100;
  const balanced = diff === 0 && debit > 0;

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (v: ManualEntryValues) => {
    // الفترة المقفلة ما تقبلش قيود جديدة
    if (isClosed(v.date)) {
      setError('date', { message: 'periodClosed' });
      return;
    }

    // TODO: حفظ القيد من الـ API
    onCreate({
      id: `je-${nextNumber}`,
      number: nextNumber,
      date: v.date,
      desc: { key: 'manual', text: v.description.trim() },
      source: 'manual',
      status: 'posted',
      lines: v.lines.map((l) => ({
        account: l.account as LineAccount,
        debit: toNum(l.debit),
        credit: toNum(l.credit),
      })),
    });

    toast.success(t('success', { number: nextNumber }));
    close();
  };

  const err = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-xs font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  const linesError = errors.lines?.root?.message ?? errors.lines?.message;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        showCloseButton={false}
        className="border-line bg-surface text-ink shadow-float w-full gap-0 border p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-line bg-brand-soft/60 relative shrink-0 flex-row items-center gap-3.5 border-b px-6 py-5 text-start">
          <span className="bg-surface text-brand ring-brand/10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
            <BookOpenText className="size-5" />
          </span>
          <div className="min-w-0 pe-8">
            <SheetTitle className="text-ink text-lg font-extrabold">
              {t('title')}
            </SheetTitle>
            <SheetDescription className="text-muted mt-1 text-xs">
              {t('description')}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('cancel')}
            className="text-muted hover:bg-surface hover:text-ink absolute end-4 top-4 rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        {/* ممكن يتحط جوه فورم تاني في شجرة React، فلازم stopPropagation */}
        <form
          noValidate
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto bg-canvas/40 p-4 sm:p-6">
            <div className="rounded-card border-line bg-surface grid gap-4 border p-4 sm:grid-cols-2">
              <div>
                <label className="text-ink-2 mb-1.5 block text-xs font-bold">
                  {t('number')}
                </label>
                <Input
                  value={nextNumber}
                  readOnly
                  dir="ltr"
                  className="border-line-strong bg-neutral-soft hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 rounded-btn h-11 text-start outline-none transition-colors focus-visible:outline-none focus-visible:ring-2"
                />
              </div>
              <div>
                <label className="text-ink-2 mb-1.5 block text-xs font-bold">
                  {t('date')}
                </label>
                <input type="date" className={fieldClass} {...register('date')} />
                {err(errors.date?.message)}
              </div>
              <div className="sm:col-span-2">
                <label className="text-ink-2 mb-1.5 block text-xs font-bold">
                  {t('descriptionLabel')}
                </label>
                <input
                  placeholder={t('descriptionPlaceholder')}
                  className={fieldClass}
                  {...register('description')}
                />
                {err(errors.description?.message)}
              </div>
            </div>

            <section className="rounded-card border-line bg-surface overflow-hidden border">
              <div className="border-line flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-ink text-sm font-extrabold">{t('lines')}</p>
                  <p className="text-muted mt-0.5 text-[11px]">{t('description')}</p>
                </div>
                <span className="bg-brand-soft text-brand-deep rounded-full px-2.5 py-1 text-[11px] font-bold">
                  {num(fields.length)}
                </span>
              </div>

              <div className="space-y-3 p-4">
                {fields.map((f, i) => (
                  <div key={f.id} className="border-line bg-canvas/50 rounded-btn border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted text-[11px] font-bold">
                        {num(i + 1)}
                      </span>
                      <button
                        type="button"
                        aria-label={t('removeLine')}
                        disabled={fields.length <= 2}
                        onClick={() => remove(i)}
                        className="text-muted hover:bg-danger-soft hover:text-danger rounded-lg p-1.5 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {/* الدرج ضيق، فالحساب في صف لوحده والمدين والدائن تحته */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted mb-1.5 block text-xs">
                          {t('account')}
                        </span>
                        <Controller
                          control={control}
                          name={`lines.${i}.account`}
                          render={({ field }) => (
                            <AccountPicker
                              value={field.value}
                              onChange={field.onChange}
                              t={t}
                              tNames={tNames}
                            />
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="min-w-0">
                          <span className="text-muted mb-1.5 block text-xs">
                            {t('debit')}
                          </span>
                          <input
                            inputMode="decimal"
                            dir="ltr"
                            placeholder="0.00"
                            className={cn(fieldClass, 'bg-surface text-start tabular-nums')}
                            {...register(`lines.${i}.debit`)}
                          />
                        </label>
                        <label className="min-w-0">
                          <span className="text-muted mb-1.5 block text-xs">
                            {t('credit')}
                          </span>
                          <input
                            inputMode="decimal"
                            dir="ltr"
                            placeholder="0.00"
                            className={cn(fieldClass, 'bg-surface text-start tabular-nums')}
                            {...register(`lines.${i}.credit`)}
                          />
                        </label>
                      </div>
                    </div>
                    {err(errors.lines?.[i]?.account?.message)}
                    {err(errors.lines?.[i]?.debit?.message)}
                    {err(errors.lines?.[i]?.credit?.message)}
                  </div>
                ))}
                {err(linesError)}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append(emptyLine)}
                  className="border-line-strong h-10 w-full gap-2 text-xs font-bold"
                >
                  <Plus className="size-4" />
                  {t('addLine')}
                </Button>
              </div>
            </section>

            <div
              className={cn(
                'rounded-card space-y-1.5 border p-4 text-xs',
                balanced
                  ? 'border-brand bg-brand-soft/40'
                  : 'border-line bg-surface',
              )}
            >
              <div className="flex justify-between">
                <span className="text-muted">{t('totalDebit')}</span>
                <span className="text-ink font-bold">{num(debit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('totalCredit')}</span>
                <span className="text-ink font-bold">{num(credit)}</span>
              </div>
              <div className="border-line flex justify-between border-t pt-1.5">
                <span className="text-ink-2 font-bold">{t('difference')}</span>
                <span
                  className={cn(
                    'font-extrabold',
                    balanced ? 'text-brand-deep' : 'text-danger',
                  )}
                >
                  {balanced ? t('balanced') : num(Math.abs(diff))}
                </span>
              </div>
            </div>
          </div>

          <div className="border-line bg-surface flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="rounded-btn border-line-strong bg-surface h-11 px-6 text-xs font-bold"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="rounded-btn bg-brand hover:bg-brand-deep h-11 px-8 text-xs font-bold text-white"
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
