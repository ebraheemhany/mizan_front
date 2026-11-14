// component/dashbord/tasks/NewTaskSheet.tsx
'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import DateField from '@/component/DateField';
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
import type { TaskKind, TaskPriority } from '@/lib/mock/tasks';
import { taskSchema, type TaskFormValues } from '@/lib/validations/tasks';

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

export default function NewTaskSheet({
  open,
  defaultDate,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  defaultDate: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => void;
}) {
  const t = useTranslations('Tasks.form');
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      due: defaultDate,
      priority: 'normal',
      kind: 'admin',
      linkType: 'none',
      linkName: '',
    },
  });

  // كل مرة الدرج يتفتح نبدأ نموذج جديد بالتاريخ المطلوب
  useEffect(() => {
    if (open) {
      reset({
        title: '',
        due: defaultDate,
        priority: 'normal',
        kind: 'admin',
        linkType: 'none',
        linkName: '',
      });
    }
  }, [open, defaultDate, reset]);

  const linkType = useWatch({ control, name: 'linkType' });

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
        className="border-line bg-surface text-ink shadow-float w-full gap-0 overflow-y-auto border sm:max-w-md"
      >
        <SheetHeader className="border-line bg-canvas/60 gap-1 border-b px-6 py-5 text-start">
          <SheetTitle className="text-ink text-base font-extrabold">
            {t('title')}
          </SheetTitle>
          <SheetDescription className="text-muted text-xs">
            {t('description')}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 px-6 py-5"
        >
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
            <label htmlFor="task-link-type" className={label}>
              {t('fields.link')}
            </label>
            <Controller
              name="linkType"
              control={control}
              render={({ field: linkTypeField }) => (
                <Select
                  value={linkTypeField.value}
                  onValueChange={(value) => {
                    if (value) linkTypeField.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="task-link-type"
                    ref={linkTypeField.ref}
                    onBlur={linkTypeField.onBlur}
                    className={`${inputClass} w-full font-semibold shadow-sm`}
                  >
                    <SelectValue>
                      {t(`linkTypes.${linkTypeField.value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-line bg-surface text-ink rounded-xl p-1.5 shadow-lg">
                    {(['none', 'customer', 'deal'] as const).map((linkType) => (
                      <SelectItem
                        key={linkType}
                        value={linkType}
                        className="rounded-btn min-h-10 px-3 py-2 text-xs font-semibold transition-colors focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep data-[selected]:bg-brand-soft data-[selected]:text-brand-deep"
                      >
                        {t(`linkTypes.${linkType}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* TODO: نبدّل حقل النص ده بـ CustomerCombobox / اختيار صفقة */}
          {linkType !== 'none' && (
            <div>
              <label htmlFor="task-link-name" className={label}>
                {t('fields.linkName')}
              </label>
              <Input
                id="task-link-name"
                placeholder={t('placeholders.linkName')}
                className={inputClass}
                {...register('linkName')}
              />
              {error(errors.linkName?.message)}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="rounded-btn bg-brand hover:bg-brand/90 h-10 flex-1 text-xs font-bold text-white"
            >
              {t('save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-btn border-line-strong h-10 border text-xs font-bold"
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
