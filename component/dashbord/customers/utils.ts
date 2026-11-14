// components/customers/utils.ts
import type { Customer, CustomerStatus } from '@/lib/mock/customers';

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

const SORTERS: Record<Filters['sort'], (a: Customer, b: Customer) => number> = {
  recent: (a, b) => a.lastActivityDaysAgo - b.lastActivityDaysAgo,
  oldest: (a, b) => b.lastActivityDaysAgo - a.lastActivityDaysAgo,
  balance: (a, b) => b.balance - a.balance,
  name: (a, b) => a.name.localeCompare(b.name, 'ar'),
};

export function applyFilters(
  list: Customer[],
  f: Filters,
  locale = 'ar',
): Customer[] {
  const q = f.query.trim().toLowerCase();

  return list
    .filter((c) => {
      if (f.status !== 'all' && c.status !== f.status) return false;
      if (f.owner !== 'all' && c.ownerId !== f.owner) return false;
      if (f.balance === 'due' && c.balance <= 0) return false;
      if (f.balance === 'zero' && c.balance !== 0) return false;
      if (q && ![c.name, c.contact, c.phone, c.email].some((v) => v.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    })
    .sort(
      f.sort === 'name'
        ? (a, b) => a.name.localeCompare(b.name, locale)
        : SORTERS[f.sort],
    );
}


export const PAGE_SIZE = 7;

export function getPageItems(page: number, total: number): (number | 'dots')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 'dots', total];
  if (page >= total - 2) return [1, 'dots', total - 2, total - 1, total];
  return [1, 'dots', page - 1, page, page + 1, 'dots', total];
}
