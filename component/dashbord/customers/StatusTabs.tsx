// components/customers/StatusTabs.tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { StatusFilter } from './utils';

const TABS: StatusFilter[] = ['all', 'active', 'overdue', 'inactive'];

export default function StatusTabs({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (value: StatusFilter) => void;
}) {
  const t = useTranslations('Customers.tabs');
  const format = useFormatter();

  return (
    <div role="group" aria-label={t('all')} className="flex flex-wrap gap-2">
      {TABS.map((key) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors',
              selected
                ? 'border-brand-dark bg-brand-dark text-white'
                : 'border-line-strong bg-surface text-ink-2 hover:bg-canvas',
            )}
          >
            {t(key)}
            <span
              className={cn(
                'tabular-nums',
                selected
                  ? 'text-brand-mint'
                  : key === 'overdue'
                    ? 'text-danger'
                    : 'text-muted',
              )}
            >
              {format.number(counts[key], { numberingSystem: 'latn' })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
