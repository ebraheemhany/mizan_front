// component/dashbord/products/utils.ts
import type { CatalogItem, ItemCategory, ItemType } from '@/lib/mock/products';

// Filtering, paging and code suggestions happen on the backend (/api/products).
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
