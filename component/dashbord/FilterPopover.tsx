// components/app/FilterPopover.tsx
'use client';

import { useState } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type Option = { value: string; label: string };

export default function FilterPopover({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  allValue,
  searchPlaceholder,
  emptyText,
}: {
  icon: LucideIcon;
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** القيمة اللي معناها "من غير فلتر". لو ما اتحددتش الزرار مش بيتلوّن (زي الترتيب) */
  allValue?: string;
  /** لو اتحدد بيظهر حقل بحث جوه القائمة */
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.value === value);
  const active = allValue !== undefined && value !== allValue;

  const text =
    allValue === undefined
      ? label && current
        ? `${label}: ${current.label}`
        : current?.label
      : active
        ? `${label}: ${current?.label}`
        : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'rounded-btn focus-visible:ring-brand/30 inline-flex h-10 items-center gap-2 border px-3.5 text-sm font-semibold transition-all outline-none focus-visible:ring-2',
          active
            ? 'border-brand/30 bg-brand-soft text-brand-deep shadow-sm hover:bg-brand-soft/80'
            : 'border-line-strong bg-surface text-ink-2 shadow-sm hover:border-brand/30 hover:bg-canvas',
        )}
        aria-label={text}
        aria-haspopup="dialog"
      >
        <Icon
          className={cn(
            'size-4 shrink-0',
            active ? 'text-brand' : 'text-muted',
          )}
        />
        <span className="max-w-48 truncate">{text}</span>
        <ChevronDown className="text-muted size-3.5 shrink-0 transition-transform data-[popup-open]:rotate-180" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line bg-surface text-ink w-64 overflow-hidden rounded-xl border p-1 shadow-lg"
      >
        <Command>
          {searchPlaceholder && (
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-10 border-line"
            />
          )}
          <CommandList>
            {emptyText && (
              <CommandEmpty className="text-muted py-6 text-sm">
                {emptyText}
              </CommandEmpty>
            )}
            <CommandGroup className="p-1">
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm data-selected:bg-brand-soft data-selected:text-brand-deep"
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  <Check
                    aria-hidden="true"
                    className={cn(
                      'text-brand size-4',
                      o.value === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}