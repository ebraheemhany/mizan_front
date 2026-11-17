// components/customers/utils.ts
import type { CustomerStatus } from '@/lib/mock/customers';

export type StatusFilter = 'all' | CustomerStatus;

export type Filters = {
  status: StatusFilter;
  query: string;
  owner: string; // 'all' أو id المسؤول
  balance: 'all' | 'due' | 'zero';
  sort: 'recent' | 'oldest' | 'balance' | 'name';
};

export const DEFAULT_FILTERS: Filters = {
  status: 'all',
  query: '',
  owner: 'all',
  balance: 'all',
  sort: 'recent',
};

// Filtering, sorting and paging happen on the backend (GET /api/customers).
export const PAGE_SIZE = 7;

export function getPageItems(page: number, total: number): (number | 'dots')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 'dots', total];
  if (page >= total - 2) return [1, 'dots', total - 2, total - 1, total];
  return [1, 'dots', page - 1, page, page + 1, 'dots', total];
}
