// component/dashbord/products/utils.ts
import type { CatalogItem, ItemCategory, ItemType } from '@/lib/mock/products';

export const PAGE_SIZE = 7;

export type TypeFilter = 'all' | ItemType;
export type CategoryFilter = ItemCategory | 'all';

export type Filters = {
  type: TypeFilter;
  category: CategoryFilter;
  query: string;
};

export const DEFAULT_FILTERS: Filters = {
  type: 'all',
  category: 'all',
  query: '',
};

export const TYPE_KEYS: TypeFilter[] = ['all', 'service', 'product'];

export type StockLevel = 'ok' | 'low' | 'out';

// null للخدمات (مفيش مخزون)
export function stockLevel(item: CatalogItem): StockLevel | null {
  if (item.type !== 'product' || item.stock === undefined) return null;
  if (item.stock <= 0) return 'out';
  if (item.stock <= (item.lowStockAt ?? 0)) return 'low';
  return 'ok';
}

export function countByType(items: CatalogItem[]) {
  return {
    all: items.length,
    service: items.filter((i) => i.type === 'service').length,
    product: items.filter((i) => i.type === 'product').length,
  } satisfies Record<TypeFilter, number>;
}

export function applyFilters(items: CatalogItem[], filters: Filters) {
  const q = filters.query.trim().toLowerCase();

  return items.filter((i) => {
    if (filters.type !== 'all' && i.type !== filters.type) return false;
    if (filters.category !== 'all' && i.category !== filters.category) {
      return false;
    }
    if (q && !`${i.name} ${i.code}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

// component/dashbord/products/utils.ts  (ضيف في الآخر)
// الكود المقترح التالي حسب النوع: SRV-015 / PRD-078
export function nextCode(items: CatalogItem[], type: ItemType) {
  const prefix = type === 'service' ? 'SRV' : 'PRD';
  const max = items
    .filter((i) => i.code.startsWith(`${prefix}-`))
    .reduce((m, i) => Math.max(m, Number(i.code.slice(4)) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

