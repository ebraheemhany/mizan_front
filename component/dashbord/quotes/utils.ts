// components/quotes/utils.ts
import type { QuoteListParams, QuoteStatus } from '@/lib/quotes/hooks';

export type StatusFilter = 'all' | QuoteStatus;
export type Period = QuoteListParams['period'];

export type Filters = {
  status: StatusFilter;
  query: string;
  period: Period;
};

export const DEFAULT_FILTERS: Filters = { status: 'all', query: '', period: 'all' };

// Filtering, counting and paging happen on the backend (GET /api/quotes).
export const PAGE_SIZE = 7;
