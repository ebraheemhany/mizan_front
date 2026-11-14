// component/dashbord/products/ItemSheet.tsx
'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CatalogItem } from '@/lib/mock/products';
import { itemSchema, type ItemFormValues } from '@/lib/validations/products';
import { CATEGORIES } from './ProductsToolbar';
import { nextCode } from './utils';

const label = 'text-ink-2 mb-1.5 block text-xs font-bold';
const input =
  'rounded-btn border-line-strong bg-surface text-ink hover:border-brand/50 focus-visible:border-brand focus-visible:ring-brand/15 h-11 text-xs transition-colors focus-visible:ring-2';
const selectTrigger = `${input} w-full font-semibold shadow-sm`;
const selectContent = 'border-line bg-surface text-ink rounded-xl shadow-lg';
const selectItem =
  'rounded-btn min-h-10 px-3 py-2 text-xs font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep';

function toDefaults(
  item: CatalogItem | null,
  items: CatalogItem[],
): ItemFormValues {
  if (!item) {
    return {
      name: '',
      type: 'service',
      code: nextCode(items, 'service'),
      price: '',
      taxRate: '14',
      category: 'software',
      stock: '',
      lowStockAt: '',
    };
  }
  return {
    name: item.name,
    type: item.type,
    code: item.code,
    price: String(item.price),
    taxRate: String(item.taxRate),
    category: item.category,
    stock: item.stock !== undefined ? String(item.stock) : '',
    lowStockAt: item.lowStockAt !== undefined ? String(item.lowStockAt) : '',
  };
}

export default function ItemSheet({
  open,
  item,
  items,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  item: CatalogItem | null; // null = صنف جديد
  items: CatalogItem[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ItemFormValues) => void;
}) {
  const t = useTranslations('Products.form');
  const tp = useTranslations('Products');
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors, dirtyFields },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: toDefaults(item, items),
  });

  // كل مرة الدرج يتفتح نبدأ من بيانات الصنف (أو فاضي)
  useEffect(() => {
    if (open) reset(toDefaults(item, items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, reset]);

  const type = useWatch({ control, name: 'type' });

  // في الصنف الجديد الكود المقترح يتغير مع النوع طالما ما اتعدّلش
  useEffect(() => {
    if (open && !item && !dirtyFields.code) {
      setValue('code', nextCode(items, type));
    }
  }, [type, open, item, items, dirtyFields.code, setValue]);

  const error = (key?: string) =>
    key ? (
      <p className="text-danger mt-1 text-[11px] font-semibold">
        {t(`errors.${key}`)}
      </p>
    ) : null;

  function submit(values: ItemFormValues) {
    const taken = items.some(
      (i) =>
        i.id !== item?.id &&
        i.code.toLowerCase() === values.code.trim().toLowerCase(),
    );
    if (taken) {
      setError('code', { message: 'codeTaken' });
      return;
    }
    onSubmit(values);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        className="border-line bg-surface text-ink w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-line bg-canvas/40 border-b px-6 py-5">
          <SheetTitle className="text-ink text-base font-extrabold">
            {item ? t('editTitle') : t('newTitle')}
          </SheetTitle>
          <SheetDescription className="text-muted text-xs">
            {t('description')}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(submit)}
          noValidate
          className="space-y-4 px-6 pb-6 pt-2"
        >
          <div>
            <label htmlFor="item-name" className={label}>
              {t('fields.name')}
            </label>
            <Input
              id="item-name"
              placeholder={t('placeholders.name')}
              className={input}
              {...register('name')}
            />
            {error(errors.name?.message)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label id="item-type-label" className={label}>
                {t('fields.type')}
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field: typeField }) => (
                  <Select
                    value={typeField.value}
                    onValueChange={(value) => {
                      if (value) typeField.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="item-type"
                      aria-labelledby="item-type-label"
                      ref={typeField.ref}
                      onBlur={typeField.onBlur}
                      className={selectTrigger}
                    >
                      <SelectValue>{tp(`types.${typeField.value}`)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className={selectContent}>
                      <SelectItem value="service" className={selectItem}>
                        {tp('types.service')}
                      </SelectItem>
                      <SelectItem value="product" className={selectItem}>
                        {tp('types.product')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <label id="item-category-label" className={label}>
                {t('fields.category')}
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field: categoryField }) => (
                  <Select
                    value={categoryField.value}
                    onValueChange={(value) => {
                      if (value) categoryField.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="item-category"
                      aria-labelledby="item-category-label"
                      ref={categoryField.ref}
                      onBlur={categoryField.onBlur}
                      className={selectTrigger}
                    >
                      <SelectValue>
                        {tp(`categories.${categoryField.value}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={selectContent}>
                      {CATEGORIES.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className={selectItem}
                        >
                          {tp(`categories.${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-code" className={label}>
              {t('fields.code')}
            </label>
            <Input
              id="item-code"
              dir="ltr"
              className={input}
              {...register('code')}
            />
            {error(errors.code?.message)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-price" className={label}>
                {t('fields.price')}
              </label>
              <Input
                id="item-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className={input}
                {...register('price')}
              />
              {error(errors.price?.message)}
            </div>
            <div>
              <label htmlFor="item-tax" className={label}>
                {t('fields.tax')}
              </label>
              <Input
                id="item-tax"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="any"
                className={input}
                {...register('taxRate')}
              />
              {error(errors.taxRate?.message)}
            </div>
          </div>

          {type === 'product' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-stock" className={label}>
                  {t('fields.stock')}
                </label>
                <Input
                  id="item-stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className={input}
                  {...register('stock')}
                />
                {error(errors.stock?.message)}
              </div>
              <div>
                <label htmlFor="item-low" className={label}>
                  {t('fields.lowStockAt')}
                </label>
                <Input
                  id="item-low"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className={input}
                  {...register('lowStockAt')}
                />
                {error(errors.lowStockAt?.message)}
              </div>
            </div>
          )}

          <div className="border-line bg-surface sticky bottom-0 flex gap-2 border-t py-3">
            <Button
              type="submit"
              className="rounded-btn bg-brand hover:bg-brand/90 h-10 flex-1 text-xs font-bold text-white"
            >
              {item ? t('saveEdit') : t('saveNew')}
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
