// component/dashbord/products/ProductsView.tsx
'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';

import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import {
  mockItems,
  type CatalogItem,
  type ItemCategory,
  type ItemType,
} from '@/lib/mock/products';
import { parseCsv } from '@/lib/csv';
import { itemSchema, type ItemFormValues } from '@/lib/validations/products';
import Pagination from '../Pagination';
import ItemSheet from './ItemSheet';
import ProductsTable from './ProductsTable';
import ProductsToolbar, { CATEGORIES } from './ProductsToolbar';
import {
  applyFilters,
  countByType,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  TYPE_KEYS,
  type Filters,
} from './utils';
import FilterTabs from '../FilterTabs';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

export default function ProductsView() {
  const t = useTranslations('Products');
  const format = useFormatter();

  // TODO: لما نربط الـ API الأصناف دي بتيجي من الباك إند
  const [items, setItems] = useState<CatalogItem[]>(mockItems);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [requestedPage, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  function openSheet(item: CatalogItem | null) {
    setEditing(item);
    setSheetOpen(true);
  }

  function saveItem(values: ItemFormValues) {
    // TODO: POST / PATCH /items لما نربط الـ API
    const isProduct = values.type === 'product';
    const data = {
      name: values.name.trim(),
      type: values.type,
      code: values.code.trim(),
      price: Number(values.price),
      taxRate: Number(values.taxRate),
      category: values.category,
      stock: isProduct ? Number(values.stock) : undefined,
      lowStockAt: isProduct ? Number(values.lowStockAt) : undefined,
    };

    if (editing) {
      const prev = editing;
      setItems((list) =>
        list.map((x) => (x.id === prev.id ? { ...x, ...data } : x)),
      );
      toast.success(t('toasts.updated', { name: data.name }), {
        action: {
          label: t('toasts.undo'),
          onClick: () =>
            setItems((list) => list.map((x) => (x.id === prev.id ? prev : x))),
        },
      });
    } else {
      const item: CatalogItem = {
        id: `i${Date.now()}`,
        usageCount: 0,
        ...data,
      };
      setItems((list) => [item, ...list]);
      toast.success(t('toasts.added', { name: item.name }), {
        action: {
          label: t('toasts.undo'),
          onClick: () =>
            setItems((list) => list.filter((x) => x.id !== item.id)),
        },
      });
    }

    // نرجّع الفلاتر علشان الصنف يظهر
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSheetOpen(false);
  }

  function deleteItem() {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const index = items.findIndex((x) => x.id === target.id);

    // TODO: DELETE /items/:id لما نربط الـ API (ومنع حذف صنف مستخدم في فواتير)
    setItems((list) => list.filter((x) => x.id !== target.id));
    setDeleteTarget(null);

    toast.success(t('toasts.deleted', { name: target.name }), {
      action: {
        label: t('toasts.undo'),
        onClick: () =>
          setItems((list) => {
            const copy = [...list];
            copy.splice(Math.min(index, copy.length), 0, target);
            return copy;
          }),
      },
    });
  }

  async function importItems(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error(t('importExport.fileType'));
        return;
      }

      const [headers, ...records] = parseCsv(await file.text());
      if (!headers?.length || records.length === 0) {
        toast.error(t('importExport.emptyFile'));
        return;
      }

      const normalize = (value: string) =>
        value.trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
      const headerAliases = {
        name: [
          t('form.fields.name'),
          'name',
          'item',
          'item name',
          'اسم الصنف',
          'الصنف',
        ],
        type: [t('form.fields.type'), 'type', 'item type', 'itemtype', 'النوع'],
        code: [t('form.fields.code'), 'code', 'item code', 'sku', 'الكود'],
        price: [t('form.fields.price'), 'price', 'السعر'],
        taxRate: [t('form.fields.tax'), 'tax', 'tax rate', 'taxrate', 'الضريبة'],
        category: [t('form.fields.category'), 'category', 'التصنيف'],
        stock: [t('form.fields.stock'), 'stock', 'quantity', 'المخزون', 'الكمية'],
        lowStockAt: [
          t('form.fields.lowStockAt'),
          'low stock at',
          'lowstockat',
          'reorder level',
          'حد التنبيه',
        ],
      } satisfies Record<string, string[]>;

      const findIndex = (key: keyof typeof headerAliases) =>
        headers.findIndex((header) =>
          headerAliases[key].some(
            (alias) => normalize(alias) === normalize(header),
          ),
        );
      const indexes = {
        name: findIndex('name'),
        type: findIndex('type'),
        code: findIndex('code'),
        price: findIndex('price'),
        taxRate: findIndex('taxRate'),
        category: findIndex('category'),
        stock: findIndex('stock'),
        lowStockAt: findIndex('lowStockAt'),
      } satisfies Record<keyof typeof headerAliases, number>;
      const required = ['name', 'type', 'code', 'price'] as const;
      const missing = required.filter((key) => indexes[key] < 0);
      if (missing.length > 0) {
        toast.error(
          t('importExport.missingColumns', {
            columns: missing.map((key) => t(`form.fields.${key}`)).join(', '),
          }),
        );
        return;
      }

      const read = (record: string[], key: keyof typeof headerAliases) =>
        indexes[key] < 0 ? '' : (record[indexes[key]] ?? '').trim();
      const typeValues: Record<string, ItemType> = {
        service: 'service',
        product: 'product',
        [normalize(t('types.service'))]: 'service',
        [normalize(t('types.product'))]: 'product',
        خدمة: 'service',
        منتج: 'product',
      };
      const categoryValues: Record<string, ItemCategory> = Object.fromEntries(
        CATEGORIES.flatMap((category) => [
          [normalize(category), category],
          [normalize(t(`categories.${category}`)), category],
        ]),
      );
      const existingCodes = new Set(
        items.map((item) => item.code.toLowerCase()),
      );
      const imported: CatalogItem[] = [];
      let invalidRows = 0;

      for (const record of records) {
        const type = typeValues[normalize(read(record, 'type'))];
        const category =
          categoryValues[normalize(read(record, 'category'))] ?? 'software';
        const stock = read(record, 'stock');
        const lowStockAt = read(record, 'lowStockAt');
        const parsed = itemSchema.safeParse({
          name: read(record, 'name'),
          type,
          code: read(record, 'code'),
          price: read(record, 'price'),
          taxRate: read(record, 'taxRate') || '0',
          category,
          stock: type === 'product' ? stock || '0' : '',
          lowStockAt: type === 'product' ? lowStockAt || '0' : '',
        });

        if (
          !parsed.success ||
          existingCodes.has(parsed.data.code.toLowerCase())
        ) {
          invalidRows += 1;
          continue;
        }

        existingCodes.add(parsed.data.code.toLowerCase());
        imported.push({
          id: `i-import-${crypto.randomUUID()}`,
          name: parsed.data.name,
          type: parsed.data.type,
          code: parsed.data.code,
          price: Number(parsed.data.price),
          taxRate: Number(parsed.data.taxRate),
          category: parsed.data.category,
          stock:
            parsed.data.type === 'product'
              ? Number(parsed.data.stock)
              : undefined,
          lowStockAt:
            parsed.data.type === 'product'
              ? Number(parsed.data.lowStockAt)
              : undefined,
          usageCount: 0,
        });
      }

      if (imported.length === 0) {
        toast.error(t('importExport.noValidRows'));
        return;
      }

      setItems((current) => [...imported, ...current]);
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      toast.success(t('importExport.imported', { count: imported.length }));
      if (invalidRows > 0) {
        toast.warning(t('importExport.skippedRows', { count: invalidRows }));
      }
    } catch (error) {
      console.error('Failed to import product CSV', error);
      toast.error(t('importExport.readFailed'));
    } finally {
      input.value = '';
    }
  }

  const counts = useMemo(() => countByType(items), [items]);

  const tabs = TYPE_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
    count: counts[key],
  }));

  const rows = useMemo(() => applyFilters(items, filters), [items, filters]);
  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const num = (value: number) =>
    format.number(value, { numberingSystem: 'latn' });

  return (
    <div className="space-y-5">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={importItems}
      />
      <PageHeader
        title={t('title')}
        description={t('summary', {
          count: items.length,
          text: num(items.length),
        })}
        actions={
          <>
            <Button
              variant="outline"
              className={outlineBtn}
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {t('actions.import')}
            </Button>
            <Button className={primaryBtn} onClick={() => openSheet(null)}>
              <Plus className="size-4" />
              {t('actions.new')}
            </Button>
          </>
        }
      />

      <FilterTabs
        value={filters.type}
        tabs={tabs}
        onChange={(type) => update({ type })}
      />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <ProductsToolbar filters={filters} onChange={update} />

        {rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {t('empty')}
          </div>
        ) : (
          <>
            <ProductsTable
              rows={pageRows}
              onEdit={openSheet}
              onDelete={setDeleteTarget}
            />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ItemSheet
        open={sheetOpen}
        item={editing}
        items={items}
        onOpenChange={setSheetOpen}
        onSubmit={saveItem}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('deleteDialog.title', { name: deleteTarget?.name ?? '' })}
        description={t('deleteDialog.description')}
        cancelLabel={t('deleteDialog.keep')}
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={deleteItem}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
