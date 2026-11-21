// component/dashbord/audit-log/AuditFilter.tsx
'use client';

import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Option = { value: string; label: string };

export default function AuditFilter({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  ariaLabel: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? '';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        className="border-line-strong bg-surface text-ink hover:bg-neutral-soft rounded-btn flex h-11 items-center gap-2 border px-4 text-xs font-bold transition-colors outline-none"
      >
        {current}
        <ChevronDown className="text-muted size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            // Base UI menu items fire onClick (onSelect is the DOM text-selection event).
            onClick={() => onChange(o.value)}
            className="flex items-center justify-between gap-3 text-xs font-semibold"
          >
            <span>{o.label}</span>
            <Check
              className={cn(
                'text-brand size-4',
                o.value === value ? 'opacity-100' : 'opacity-0',
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
