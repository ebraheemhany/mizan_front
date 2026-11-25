// component/dashbord/tasks/NewTaskSheet.tsx
'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck, Loader2, X } from 'lucide-react';

import DateField from '@/component/DateField';
import {
  dialogCancelButton,
  dialogClose,
  dialogConfirmButton,
  dialogDescription,
  dialogHeading,
  dialogIconTile,
  dialogScrollBody,
  dialogTitle,
  sheetFooterBar,
  sheetHeaderBar,
  sheetPopup,
} from '@/component/dialog-chrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useDeals } from '@/lib/deals/hooks';
import type { TaskKind, TaskPriority } from '@/lib/tasks/hooks';
import { cn } from '@/lib/utils';
import { taskSchema, type TaskFormValues } from '@/lib/validations/tasks';
import TaskCustomerPicker from './TaskCustomerPicker';

const PRIORITIES: TaskPriority[] = ['urgent', 'important', 'normal'];
const KINDS: TaskKind[] = [
  'meeting',
  'quote',
  'collection',
  'visit',
  'deadline',
  'admin',
];

const inputClass =
  'rounded-btn border-line-strong bg-surface text-ink hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 text-xs transition-colors focus-visible:ring-2';
const label = 'text-ink-2 mb-1.5 block text-xs font-bold';

/** A deal the new task is about (from the deals board): the task starts linked to it. */
export type TaskDealPreset = { id: string; title: string; customerId: string; customer: string };

export default function NewTaskSheet({
  open,
  defaultDate,
  presetDeal,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  defaultDate: string;
  presetDeal?: TaskDealPreset | null;
  onOpenChange: (open: boolean) => void;
  /** Saves the task; true when it was saved (the sheet closes), false to keep it open. */
  onSubmit: (values: TaskFormValues) => Promise<boolean>;
}) {
  const t = useTranslations('Tasks.form');
  const locale = useLocale();
  // Open deals to link the task to (every role can read them).
  const dealsQuery = useDeals();
  const openDeals = (dealsQuery.data?.deals ?? []).filter((d) => d.stage !== 'won' && !d.lost);

  const blank = (): TaskFormValues => ({
    title: '',
    due: defaultDate,
    priority: 'normal',
    kind: presetDeal ? 'meeting' : 'admin',
    customer: presetDeal ? { id: presetDeal.customerId, name: presetDeal.customer } : null,
    deal: presetDeal ? { id: presetDeal.id, title: presetDeal.title } : null,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: blank(),
  });

  // كل مرة الدرج يتفتح نبدأ نموذج جديد بالتاريخ المطلوب
  useEffect(() => {
    if (open) reset(blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new form each time it opens
  }, [open, defaultDate, presetDeal, reset]);

  // لو الحفظ فشل الدرج يفضل مفتوح بالبيانات (الرسالة بتظهر في toast)
  async function save(values: TaskFormValues) {
    if (await onSubmit(values)) onOpenChange(false);
  }

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        showCloseButton={false}
        className={cn(sheetPopup, 'sm:max-w-md')}
      >
        <SheetHeader className={sheetHeaderBar()}>
          <span className={dialogIconTile()}>
            <CalendarCheck className="size-5" />
          </span>
          <div className={dialogHeading}>
            <SheetTitle className={dialogTitle}>{t('title')}</SheetTitle>
            <SheetDescription className={dialogDescription}>{t('description')}</SheetDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t('close')} className={dialogClose}>
            <X className="size-4" />
          </button>
        </SheetHeader>

        <form onSubmit={handleSubmit(save)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className={cn(dialogScrollBody, 'space-y-5 px-6 py-5')}>
            <div>
              <label htmlFor="task-title" className={label}>
                {t('fields.title')}
              </label>
              <Input
                id="task-title"
                placeholder={t('placeholders.title')}
                className={inputClass}
                {...register('title')}
              />
              {error(errors.title?.message)}
            </div>

            <div>
              <label htmlFor="task-due" className={label}>
                {t('fields.due')}
              </label>
              <Controller
                name="due"
                control={control}
                render={({ field: dueField }) => (
                  <DateField
                    id="task-due"
                    value={dueField.value}
                    onChange={dueField.onChange}
                    placeholder={t('fields.due')}
                    invalid={!!errors.due}
                  />
                )}
              />
              {error(errors.due?.message)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-priority" className={label}>
                  {t('fields.priority')}
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field: priorityField }) => (
                    <Select
                      value={priorityField.value}
                      onValueChange={(value) => {
                        if (value) priorityField.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id="task-priority"
                        ref={priorityField.ref}
                        onBlur={priorityField.onBlur}
                        className={`${inputClass} w-full font-semibold shadow-sm`}
                      >
                        <SelectValue>
                          {t(`priorities.${priorityField.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-line bg-surface text-ink rounded-xl p-1.5 shadow-lg">
                        {PRIORITIES.map((priority) => (
                          <SelectItem
                            key={priority}
                            value={priority}
                            className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold transition-colors focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep data-[selected]:bg-brand-soft data-[selected]:text-brand-deep"
                          >
                            {t(`priorities.${priority}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label htmlFor="task-kind" className={label}>
                  {t('fields.kind')}
                </label>
                <Controller
                  name="kind"
                  control={control}
                  render={({ field: kindField }) => (
                    <Select
                      value={kindField.value}
                      onValueChange={(value) => {
                        if (value) kindField.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id="task-kind"
                        ref={kindField.ref}
                        onBlur={kindField.onBlur}
                        className={`${inputClass} w-full font-semibold shadow-sm`}
                      >
                        <SelectValue>
                          {t(`kinds.${kindField.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-line bg-surface text-ink rounded-xl p-1.5 shadow-lg">
                        {KINDS.map((kind) => (
                          <SelectItem
                            key={kind}
                            value={kind}
                            className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold transition-colors focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep data-[selected]:bg-brand-soft data-[selected]:text-brand-deep"
                          >
                            {t(`kinds.${kind}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div>
              <label htmlFor="task-deal" className={label}>
                {t('fields.deal')}
              </label>
              <Controller
                name="deal"
                control={control}
                render={({ field: dealField }) => (
                  <Select
                    value={dealField.value?.id ?? 'none'}
                    onValueChange={(value) => {
                      const picked = openDeals.find((d) => d.id === value) ?? (presetDeal?.id === value ? presetDeal : null);
                      if (!picked) {
                        dealField.onChange(null);
                        return;
                      }
                      dealField.onChange({ id: picked.id, title: picked.title });
                      // The deal's customer, unless one was already chosen.
                      if (!getValues('customer')) {
                        setValue('customer', { id: picked.customerId, name: picked.customer });
                      }
                    }}
                  >
                    <SelectTrigger
                      id="task-deal"
                      ref={dealField.ref}
                      onBlur={dealField.onBlur}
                      className={`${inputClass} w-full font-semibold shadow-sm`}
                    >
                      <SelectValue>{dealField.value ? dealField.value.title : t('dealNone')}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-line bg-surface text-ink max-h-72 rounded-xl p-1.5 shadow-lg">
                      <SelectItem
                        value="none"
                        className="rounded-btn text-muted min-h-10 px-3 py-2 text-xs font-semibold"
                      >
                        {t('dealNone')}
                      </SelectItem>
                      {[...openDeals, ...(presetDeal && !openDeals.some((d) => d.id === presetDeal.id) ? [presetDeal] : [])].map(
                        (deal) => (
                          <SelectItem
                            key={deal.id}
                            value={deal.id}
                            className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold transition-colors focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep data-[selected]:bg-brand-soft data-[selected]:text-brand-deep"
                          >
                            {deal.title} · {deal.customer}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <label htmlFor="task-customer" className={label}>
                {t('fields.customer')}
              </label>
              <Controller
                name="customer"
                control={control}
                render={({ field: customerField }) => (
                  <TaskCustomerPicker
                    id="task-customer"
                    value={customerField.value}
                    onChange={customerField.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className={sheetFooterBar}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={dialogCancelButton}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(dialogConfirmButton, 'bg-brand hover:bg-brand/90')}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
