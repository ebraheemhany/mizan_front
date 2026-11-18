// component/dashbord/payments/utils.ts
import type { PaymentMethod } from '@/lib/mock/payments';

// Filtering, paging and the stats are worked out by the backend (/api/payments).
export const PAGE_SIZE = 6;

export type PeriodFilter = 'thisMonth' | 'lastMonth' | 'thisYear' | 'all';
export type MethodFilter = PaymentMethod | 'all';

export type Filters = {
  query: string;
  method: MethodFilter;
  period: PeriodFilter;
};

export const DEFAULT_FILTERS: Filters = {
  query: '',
  method: 'all',
  period: 'all',
};
