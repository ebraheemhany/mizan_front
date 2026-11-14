// components/app/FilterSelect.tsx
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type Option = { value: string; label: string };

const triggerClass =
  'h-10 w-full rounded-btn border-line-strong bg-surface text-xs font-semibold lg:w-auto lg:min-w-44';

export default function FilterSelect({
  value,
  options,
  prefix,
  onChange,
}: {
  value: string;
  options: Option[];
  prefix?: string;
  onChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className={triggerClass}>
        {prefix && <span className="text-muted">{prefix}:</span>}
        <SelectValue>{current?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
