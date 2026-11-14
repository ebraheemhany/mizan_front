// components/invoices/LineItemsSection.tsx
'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FieldError, FormSection } from '@/component/form-parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { lineAmount, type InvoiceFormItem } from '@/lib/validations/invoice';

// بيشتغل مع أي نموذج فيه حقل items بنفس الشكل، لازم يتلف بـ FormProvider
type ItemsShape = { items: InvoiceFormItem[] };

const EMPTY_ITEM = { description: '', quantity: '1', unitPrice: '' };
const fieldClass =
  'rounded-btn border-line-strong bg-surface hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 h-11';
const gridCols = 'sm:grid-cols-[minmax(0,1fr)_6rem_8rem_7rem_2.25rem]';

export default function LineItemsSection({
  namespace = 'InvoiceForm.items',
}: {
  namespace?: 'InvoiceForm.items' | 'QuoteForm.items';
}) {
  const t = useTranslations(namespace);
  const money = useMoney();

  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ItemsShape>();

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) ?? [];

  return (
    <FormSection title={t('title')}>
      <div
        className={cn(
          'text-muted mb-2 hidden gap-3 text-xs font-bold sm:grid',
          gridCols,
        )}
      >
        <span>{t('description')}</span>
        <span>{t('quantity')}</span>
        <span>{t('price')}</span>
        <span>{t('total')}</span>
        <span />
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const row = items[index];
          const rowErrors = errors.items?.[index];

          return (
            <div
              key={field.id}
              className={cn(
                'border-line grid gap-3 rounded-xl border p-3 sm:items-start sm:border-0 sm:p-0',
                gridCols,
              )}
            >
              <div>
                <Label
                  htmlFor={`desc-${index}`}
                  className="text-muted mb-1.5 text-xs sm:sr-only"
                >
                  {t('description')}
                </Label>
                <Input
                  id={`desc-${index}`}
                  placeholder={t('descriptionPlaceholder')}
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
                  {t('quantity')}
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
                  {t('price')}
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
                  {t('total')}
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
                aria-label={t('remove', { index: index + 1 })}
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
        className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas mt-4 h-10 gap-2 text-xs font-bold"
      >
        <Plus className="size-4" />
        {t('add')}
      </Button>
    </FormSection>
  );
}
