// component/dashbord/reports/ReportsTabs.tsx
'use client';

import { cn } from '@/lib/utils';

export type ReportTab<T extends string> = {
  value: T;
  label: string;
};

export default function ReportsTabs<T extends string>({
  value,
  tabs,
  onChange,
}: {
  value: T;
  tabs: ReportTab<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="border-line flex w-full [scrollbar-width:none] gap-6 overflow-x-auto border-b [&::-webkit-scrollbar]:hidden"
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
              'focus-visible:ring-brand/30 relative shrink-0 pb-3 text-xs font-bold transition-colors outline-none focus-visible:ring-2',
              "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:content-['']",
              selected
                ? 'text-brand-deep after:bg-brand'
                : 'text-ink-2 hover:text-ink after:bg-transparent',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
