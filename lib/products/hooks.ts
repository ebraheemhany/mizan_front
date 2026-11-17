// lib/products/hooks.ts
// Products & services catalog (backend /api/products) as TanStack Query hooks,
// plus conversion between the API shape and the shape the products UI uses.
'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { CatalogItem, ItemCategory, ItemType } from '@/lib/mock/products';
import { queryKeys } from '@/lib/query/keys';
import type { ItemFormValues } from '@/lib/validations/products';

export type ApiProduct = {
  id: string;
  name: string;
  type: ItemType;
  code: string;
  /** Money as a 2-decimal string, e.g. "1850.00". */
  price: string;
  /** Percent as a 2-decimal string, e.g. "14.00". */
  taxRate: string;
  category: ItemCategory;
  stock: number | null;
  lowStockAt: number | null;
  usageCount: number;
  createdAt: string;
};

export type ProductListParams = {
  q?: string;
  type: 'all' | ItemType;
  category: 'all' | ItemCategory;
  page: number;
  pageSize: number;
};

type ProductListResponse = {
  items: ApiProduct[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<'all' | ItemType, number>;
};

/** What the backend accepts. Money stays a string so nothing is rounded on the way. */
export type ProductInput = {
  name: string;
  type: ItemType;
  code: string;
  price: string;
  taxRate: string;
  category: ItemCategory;
  stock?: string;
  lowStockAt?: string;
};

/** API product -> the shape the existing table and sheet use. */
export function toUiItem(p: ApiProduct): CatalogItem {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    code: p.code,
    // For display only; money calculations happen on the backend.
    price: Number(p.price),
    taxRate: Number(p.taxRate),
    category: p.category,
    stock: p.stock ?? undefined,
    lowStockAt: p.lowStockAt ?? undefined,
    usageCount: p.usageCount,
  };
}

/** The add/edit form -> the API body (stock only for products). */
export function formToInput(values: ItemFormValues): ProductInput {
  const input: ProductInput = {
    name: values.name.trim(),
    type: values.type,
    code: values.code.trim(),
    price: values.price.trim(),
    taxRate: values.taxRate.trim(),
    category: values.category,
  };
  if (values.type === 'product') {
    input.stock = values.stock.trim() || '0';
    input.lowStockAt = values.lowStockAt.trim() || '0';
  }
  return input;
}

function toQueryString(params: Partial<ProductListParams>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => api<ProductListResponse>(`/api/products${toQueryString(params)}`),
    placeholderData: keepPreviousData,
  });
}

/** Suggested code for a new item of this type (SRV-015, PRD-078...). */
export function useNextProductCode(type: ItemType, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.products.nextCode(type),
    queryFn: async () => (await api<{ code: string }>(`/api/products/next-code?type=${type}`)).code,
    enabled,
    // Always ask again when the sheet opens: someone may have added items since.
    staleTime: 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations: each one refreshes every products query (lists, counts, next code).
// ---------------------------------------------------------------------------

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductInput) => api<{ product: ApiProduct }>('/api/products', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
      api<{ product: ApiProduct }>(`/api/products/${id}`, { method: 'PATCH', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api(`/api/products/${id}`, { method: 'DELETE' }),
    onSettled: invalidate,
  });
}

export function useImportProducts() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (products: ProductInput[]) =>
      api<{ created: number }>('/api/products/import', { method: 'POST', body: { products } }),
    onSuccess: invalidate,
  });
}
