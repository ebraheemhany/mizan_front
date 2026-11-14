// components/customers/Pagination.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getPageItems } from './customers/utils';

const btn =
  'border-line-strong bg-surface text-ink hover:bg-canvas flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40';

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations('Customers.pagination');
  const format = useFormatter();
  const n = (v: number) => format.number(v, { numberingSystem: 'latn' });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-muted text-xs tabular-nums">
        {t('showing', { from: n(from), to: n(to), total: n(total) })}
      </p>

      <nav aria-label={t('label')} className="flex items-center gap-1.5">
        <button
          type="button"
          className={btn}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('previous')}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>

        {getPageItems(page, totalPages).map((item, i) =>
          item === 'dots' ? (
            <span
              key={`dots-${i}`}
              className="text-muted w-6 text-center text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={t('page', { page: item })}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                btn,
                'tabular-nums',
                item === page &&
                  'border-brand bg-brand hover:bg-brand font-bold text-white',
              )}
            >
              {n(item)}
            </button>
          ),
        )}

        <button
          type="button"
          className={btn}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('next')}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
      </nav>
    </div>
  );
}
