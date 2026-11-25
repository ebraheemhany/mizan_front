// component/dashbord/accounts/ManualEntrySheet.tsx
'use client';

import { useState } from 'react';
import { Controller, useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { BookOpenText, Check, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import DateField from '@/component/DateField';
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { addDaysIso, deviceCairoToday } from '@/lib/iso-date';
import {
  useSaveEntry,
  type EntryStatus,
  type JournalEntry,
  type LedgerAccount,
} from '@/lib/ledger/hooks';
import { cn } from '@/lib/utils';
import { manualEntrySchema, toCents, type ManualEntryValues } from '@/lib/validations/journal-entry';
import { useAccountName, useNum } from './ledger-ui';

type Props = {
  open: boolean;
  onClose: () => void;
  /** A manual entry to edit; none for a new one. */
  entry: JournalEntry | null;
  accounts: LedgerAccount[];
  /** Nothing can be dated on or before this day. */
  closedThrough: string | null;
};

const emptyLine = { accountId: '', debit: '', credit: '' };
/** Accounts the documents keep: a manual entry there won't show on customer statements or due expenses. */
const AUTO_KEYS = new Set(['customers', 'cheques', 'suppliers']);

const fieldClass =
  'border-line-strong hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 w-full rounded-btn border bg-transparent px-3 text-xs outline-none transition-colors focus-visible:outline-none focus-visible:ring-2';

function AccountPicker({
  value,
  onChange,
  accounts,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  accounts: LedgerAccount[];
  invalid?: boolean;
}) {
  const t = useTranslations('Accounts.manual');
  const accountName = useAccountName();
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t('account')}
        aria-invalid={invalid}
        className={cn(
          fieldClass,
          'bg-surface flex items-center justify-between gap-2 text-start',
          selected ? 'text-ink' : 'text-muted',
          invalid && 'border-danger',
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? `${selected.code} · ${accountName(selected)}` : t('selectAccount')}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="border-line bg-surface w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl border p-0 shadow-lg"
      >
        <Command className="bg-surface rounded-xl p-1.5">
          <CommandInput placeholder={t('searchAccount')} className="text-ink placeholder:text-muted" />
          <CommandList className="max-h-64 py-1">
            <CommandEmpty className="text-muted py-5 text-xs">{t('noAccount')}</CommandEmpty>
            <CommandGroup>
              {accounts.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.code} ${accountName(a)}`}
                  onSelect={() => {
                    onChange(a.id);
                    setOpen(false);
                  }}
                  className="text-ink cursor-pointer"
                >
                  <span className="text-muted w-10 shrink-0 tabular-nums" dir="ltr">
                    {a.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{accountName(a)}</span>
                  {a.id === value && <Check className="text-brand size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ManualEntrySheet({ open, onClose, entry, accounts, closedThrough }: Props) {
  const t = useTranslations('Accounts.manual');
  const tDates = useTranslations('InvoiceForm.details');
  const locale = useLocale();
  const num = useNum();
  const errorMessage = useApiErrorMessage();
  const saveEntry = useSaveEntry();

  const firstOpenDay = closedThrough ? addDaysIso(closedThrough, 1) : undefined;
  const isClosed = (date: string) => closedThrough !== null && date <= closedThrough;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ManualEntryValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: entry
      ? {
          date: entry.date,
          description: entry.memo ?? '',
          lines: entry.lines.map((l) => ({
            accountId: l.id,
            debit: l.debit ? String(l.debit) : '',
            credit: l.credit ? String(l.credit) : '',
          })),
        }
      : { date: deviceCairoToday(), description: '', lines: [emptyLine, emptyLine] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watched = useWatch({ control, name: 'lines' });

  const debit = (watched ?? []).reduce((s, l) => s + toCents(l.debit), 0) / 100;
  const credit = (watched ?? []).reduce((s, l) => s + toCents(l.credit), 0) / 100;
  const diff = Math.round((debit - credit) * 100) / 100;
  const balanced = diff === 0 && debit > 0;

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async (v: ManualEntryValues, status: EntryStatus) => {
    if (isClosed(v.date)) {
      setError('date', { message: 'periodClosed' }, { shouldFocus: true });
      return;
    }
    try {
      const saved = await saveEntry.mutateAsync({
        id: entry?.id,
        input: {
          date: v.date,
          memo: v.description.trim(),
          status,
          lines: v.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit.replace(/,/g, '') || '0',
            credit: l.credit.replace(/,/g, '') || '0',
          })),
        },
      });
      toast.success(
        entry
          ? t('updated', { number: saved.ref ?? '' })
          : t(saved.status === 'draft' ? 'savedDraft' : 'success', { number: saved.ref ?? '' }),
      );
      close();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PERIOD_CLOSED') {
        setError('date', { message: 'periodClosed' }, { shouldFocus: true });
      } else if (error instanceof ApiError && error.code === 'ENTRY_NOT_BALANCED') {
        setError('lines', { message: 'unbalanced' });
      } else {
        toast.error(errorMessage(error));
      }
    }
  };

  const err = (key?: string) =>
    key ? <p className="text-danger mt-1 text-xs font-semibold">{t(`errors.${key}`)}</p> : null;

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
              {entry ? t('editTitle', { number: entry.ref ?? '' }) : t('title')}
            </SheetTitle>
            <SheetDescription className="text-muted mt-1 text-xs">{t('description')}</SheetDescription>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('cancel')}
            className="text-muted hover:bg-surface hover:text-ink focus-visible:ring-brand/30 absolute end-4 top-4 rounded-lg p-1.5 transition-colors outline-none focus-visible:ring-2"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        {/* ممكن يتحط جوه فورم تاني في شجرة React، فلازم stopPropagation */}
        <form
          noValidate
          onSubmit={(e) => {
            e.stopPropagation();
            // Enter and the main button post; the draft button saves a draft.
            void handleSubmit((v) => onSubmit(v, 'posted'))(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="bg-canvas/40 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {/* minmax(0,1fr) + min-w-0: the date field shrinks instead of pushing past the sheet. */}
            <div className="rounded-card border-line bg-surface grid gap-4 border p-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <div className="min-w-0">
                <label className="text-ink-2 mb-1.5 block text-xs font-bold">{t('number')}</label>
                <Input
                  value={entry?.ref ?? t('autoNumber')}
                  readOnly
                  dir={entry ? 'ltr' : undefined}
                  className="border-line-strong bg-neutral-soft rounded-btn h-11 text-start"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="entry-date" className="text-ink-2 mb-1.5 block text-xs font-bold">
                  {t('date')}
                </label>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DateField
                      id="entry-date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={tDates('pickDate')}
                      invalid={!!errors.date}
                      minDate={firstOpenDay}
                    />
                  )}
                />
                {err(errors.date?.message)}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="entry-memo" className="text-ink-2 mb-1.5 block text-xs font-bold">
                  {t('descriptionLabel')}
                </label>
                <input
                  id="entry-memo"
                  placeholder={t('descriptionPlaceholder')}
                  aria-invalid={!!errors.description}
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
                  <p className="text-muted mt-0.5 text-[11px]">{t('linesHint')}</p>
                </div>
                <span className="bg-brand-soft text-brand-deep rounded-full px-2.5 py-1 text-[11px] font-bold">
                  {num(fields.length)}
                </span>
              </div>

              <div className="space-y-3 p-4">
                {fields.map((f, i) => (
                  <div key={f.id} className="border-line bg-canvas/50 rounded-btn border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted text-[11px] font-bold">{num(i + 1)}</span>
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
                        <span className="text-muted mb-1.5 block text-xs">{t('account')}</span>
                        <Controller
                          control={control}
                          name={`lines.${i}.accountId`}
                          render={({ field }) => (
                            <AccountPicker
                              value={field.value}
                              onChange={field.onChange}
                              accounts={accounts}
                              invalid={!!errors.lines?.[i]?.accountId}
                            />
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="min-w-0">
                          <span className="text-muted mb-1.5 block text-xs">{t('debit')}</span>
                          <input
                            inputMode="decimal"
                            dir="ltr"
                            placeholder="0.00"
                            autoComplete="off"
                            className={cn(fieldClass, 'bg-surface text-start tabular-nums')}
                            {...register(`lines.${i}.debit`)}
                          />
                        </label>
                        <label className="min-w-0">
                          <span className="text-muted mb-1.5 block text-xs">{t('credit')}</span>
                          <input
                            inputMode="decimal"
                            dir="ltr"
                            placeholder="0.00"
                            autoComplete="off"
                            className={cn(fieldClass, 'bg-surface text-start tabular-nums')}
                            {...register(`lines.${i}.credit`)}
                          />
                        </label>
                      </div>
                    </div>
                    {AUTO_KEYS.has(accounts.find((a) => a.id === watched?.[i]?.accountId)?.key ?? '') && (
                      <p className="text-amber-700 mt-2 text-[11px] leading-5">{t('autoAccountHint')}</p>
                    )}
                    {err(errors.lines?.[i]?.accountId?.message)}
                    {err(errors.lines?.[i]?.debit?.message)}
                    {err(errors.lines?.[i]?.credit?.message)}
                  </div>
                ))}
                {err(linesError)}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append(emptyLine)}
                  disabled={fields.length >= 50}
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
                balanced ? 'border-brand bg-brand-soft/40' : 'border-line bg-surface',
              )}
            >
              <div className="flex justify-between">
                <span className="text-muted">{t('totalDebit')}</span>
                <span className="text-ink font-bold tabular-nums">{num(debit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('totalCredit')}</span>
                <span className="text-ink font-bold tabular-nums">{num(credit)}</span>
              </div>
              <div className="border-line flex justify-between border-t pt-1.5">
                <span className="text-ink-2 font-bold">{t('difference')}</span>
                <span className={cn('font-extrabold tabular-nums', balanced ? 'text-brand-deep' : 'text-danger')}>
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
            {/* A posted entry stays posted; a new one or a draft can be saved as a draft. */}
            {entry?.status !== 'posted' && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={(e) => void handleSubmit((v) => onSubmit(v, 'draft'))(e)}
                className="rounded-btn border-line-strong bg-surface h-11 px-6 text-xs font-bold"
              >
                {t('saveDraft')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-btn bg-brand hover:bg-brand-deep h-11 px-8 text-xs font-bold text-white"
            >
              {entry?.status === 'posted' ? t('saveChanges') : t('save')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
