// component/dashbord/products/ProductsView.tsx
'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Loader2, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmDialog from '@/component/ConfirmDialog';
import PageHeader from '@/component/PageHeader';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import { parseCsv } from '@/lib/csv';
import type { CatalogItem, ItemCategory, ItemType } from '@/lib/mock/products';
import {
  formToInput,
  toUiItem,
  useCreateProduct,
  useDeleteProduct,
  useImportProducts,
  useProducts,
  useUpdateProduct,
  type ProductInput,
} from '@/lib/products/hooks';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { itemSchema, type ItemFormValues } from '@/lib/validations/products';
import Pagination from '../Pagination';
import FilterTabs from '../FilterTabs';
import ItemSheet from './ItemSheet';
import ProductsTable from './ProductsTable';
import ProductsToolbar, { CATEGORIES } from './ProductsToolbar';
import { DEFAULT_FILTERS, PAGE_SIZE, TYPE_KEYS, type Filters } from './utils';

const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';
const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 border text-xs font-bold';

export default function ProductsView() {
  const t = useTranslations('Products');
  const tApi = useTranslations('ProductsApi');
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const canEdit = can(user.role, 'editProducts');
  const canDelete = can(user.role, 'deleteData');

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Search waits until typing pauses, so we don't send a request per keystroke.
  const query = useDebouncedValue(filters.query.trim(), 300);
  const productsQuery = useProducts({
    q: query || undefined,
    type: filters.type,
    category: filters.category,
    page,
    pageSize: PAGE_SIZE,
  });
  const data = productsQuery.data;
  const rows = useMemo(() => data?.items.map(toUiItem) ?? [], [data]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const importMutation = useImportProducts();

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  function openSheet(item: CatalogItem | null) {
    setEditing(item);
    setSheetOpen(true);
  }

  /** Throws on failure: ItemSheet shows "code taken" on the field, or a toast. */
  async function saveItem(values: ItemFormValues) {
    const input = formToInput(values);
    if (editing) {
      await updateProduct.mutateAsync({ id: editing.id, input });
      toast.success(t('toasts.updated', { name: input.name }));
    } else {
      await createProduct.mutateAsync(input);
      toast.success(t('toasts.added', { name: input.name }));
      // Back to the default view so the new item shows first.
      setFilters(DEFAULT_FILTERS);
      setPage(1);
    }
    setSheetOpen(false);
  }

  function deleteItem() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    deleteProduct.mutate(target.id, {
      onSuccess: () => {
        // If that emptied the current page, step back one.
        if (rows.length === 1 && page > 1) setPage(page - 1);
        toast.success(t('toasts.deleted', { name: target.name }));
      },
      onError: (error) => toast.error(errorMessage(error)),
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

      const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
      const headerAliases = {
        name: [t('form.fields.name'), 'name', 'item', 'item name', 'اسم الصنف', 'الصنف'],
        type: [t('form.fields.type'), 'type', 'item type', 'itemtype', 'النوع'],
        code: [t('form.fields.code'), 'code', 'item code', 'sku', 'الكود'],
        price: [t('form.fields.price'), 'price', 'السعر'],
        taxRate: [t('form.fields.tax'), 'tax', 'tax rate', 'taxrate', 'الضريبة'],
        category: [t('form.fields.category'), 'category', 'التصنيف'],
        stock: [t('form.fields.stock'), 'stock', 'quantity', 'المخزون', 'الكمية'],
        lowStockAt: [t('form.fields.lowStockAt'), 'low stock at', 'lowstockat', 'reorder level', 'حد التنبيه'],
      } satisfies Record<string, string[]>;

      const findIndex = (key: keyof typeof headerAliases) =>
        headers.findIndex((header) => headerAliases[key].some((alias) => normalize(alias) === normalize(header)));
      const indexes = Object.fromEntries(
        (Object.keys(headerAliases) as (keyof typeof headerAliases)[]).map((key) => [key, findIndex(key)]),
      ) as Record<keyof typeof headerAliases, number>;

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

      // Rows that fail the form rules are skipped here. Codes already in the
      // catalog are checked by the server (it knows the whole catalog).
      const valid: ProductInput[] = [];
      const codesInFile = new Set<string>();
      let invalidRows = 0;

      for (const record of records) {
        const type = typeValues[normalize(read(record, 'type'))];
        const parsed = itemSchema.safeParse({
          name: read(record, 'name'),
          type,
          code: read(record, 'code'),
          price: read(record, 'price'),
          taxRate: read(record, 'taxRate') || '0',
          category: categoryValues[normalize(read(record, 'category'))] ?? 'software',
          stock: type === 'product' ? read(record, 'stock') || '0' : '',
          lowStockAt: type === 'product' ? read(record, 'lowStockAt') || '0' : '',
        });
        const code = parsed.success ? parsed.data.code.trim().toUpperCase() : '';
        if (!parsed.success || codesInFile.has(code)) {
          invalidRows += 1;
          continue;
        }
        codesInFile.add(code);
        valid.push(formToInput(parsed.data));
      }

      if (valid.length === 0) {
        toast.error(t('importExport.noValidRows'));
        return;
      }

      const { created } = await importMutation.mutateAsync(valid);
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      toast.success(t('importExport.imported', { count: created }));
      if (invalidRows > 0) {
        toast.warning(t('importExport.skippedRows', { count: invalidRows }));
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'IMPORT_INVALID_ROWS') {
        const count = (error.details as { invalidCount?: number } | undefined)?.invalidCount ?? 1;
        toast.error(tApi('importInvalidRows', { count }));
      } else if (error instanceof ApiError) {
        toast.error(errorMessage(error));
      } else {
        console.error('Failed to import product CSV', error);
        toast.error(t('importExport.readFailed'));
      }
    } finally {
      input.value = '';
    }
  }

  const tabs = TYPE_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
    count: data?.counts[key] ?? 0,
  }));
  const totalItems = data?.counts.all ?? 0;
  const num = (value: number) => format.number(value, { numberingSystem: 'latn' });

  return (
    <div className="space-y-5">
      <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importItems} />
      <PageHeader
        title={t('title')}
        description={t('summary', { count: totalItems, text: num(totalItems) })}
        actions={
          canEdit && (
            <>
              <Button
                variant="outline"
                className={outlineBtn}
                disabled={importMutation.isPending}
                onClick={() => importInputRef.current?.click()}
              >
                {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {t('actions.import')}
              </Button>
              <Button className={primaryBtn} onClick={() => openSheet(null)}>
                <Plus className="size-4" />
                {t('actions.new')}
              </Button>
            </>
          )
        }
      />

      <FilterTabs value={filters.type} tabs={tabs} onChange={(type) => update({ type })} />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <ProductsToolbar filters={filters} onChange={update} />

        {productsQuery.isPending ? (
          <div className="border-line text-muted flex justify-center border-t px-4 py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : productsQuery.isError ? (
          <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
            <p className="text-danger text-sm font-semibold">{tApi('loadError')}</p>
            <Button variant="outline" className={outlineBtn} onClick={() => productsQuery.refetch()}>
              {tApi('retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">{t('empty')}</div>
        ) : (
          // Dimmed while the next page or filter result loads.
          <div className={productsQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <ProductsTable
              rows={rows}
              onEdit={canEdit ? openSheet : undefined}
              onDelete={canDelete ? setDeleteTarget : undefined}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
          </div>
        )}
      </div>

      {canEdit && <ItemSheet open={sheetOpen} item={editing} onOpenChange={setSheetOpen} onSubmit={saveItem} />}

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
