// components/app/FilterTabs.tsx
'use client';

import { useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';

export type FilterTab<T extends string> = {
  value: T;
  label: string;
  count: number;
  tone?: 'danger';
};

export default function FilterTabs<T extends string>({
  value,
  tabs,
  onChange,
}: {
  value: T;
  tabs: FilterTab<T>[];
  onChange: (value: T) => void;
}) {
  const format = useFormatter();

  return (
    <div
      role="tablist"
      className="border-line bg-canvas/70 flex w-full gap-1 overflow-x-auto rounded-xl border p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const selected = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'focus-visible:ring-brand/30 inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all outline-none focus-visible:ring-2',
              selected
                ? 'bg-surface text-brand-deep shadow-sm ring-1 ring-black/5'
                : 'text-ink-2 hover:bg-surface/70 hover:text-ink',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[11px] leading-none tabular-nums',
                selected
                  ? 'bg-brand-soft text-brand-deep'
                  : tab.tone === 'danger'
                    ? 'bg-danger-soft text-danger'
                    : 'bg-surface text-muted',
              )}
            >
              {format.number(tab.count, { numberingSystem: 'latn' })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
