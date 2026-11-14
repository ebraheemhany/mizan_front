// components/app/DateField.tsx
'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useLocale } from 'next-intl';
import { ar, enUS } from 'react-day-picker/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { rtlLocales } from '@/i18n/routing';
import { useDate } from '@/lib/data';
import { fromIso, toIso } from '@/lib/iso-date';
import { cn } from '@/lib/utils';

export default function DateField({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  minDate,
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder: string;
  invalid?: boolean;
  /** الأيام قبل التاريخ ده بتتعطّل في التقويم */
  minDate?: string;
}) {
  const locale = useLocale();
  const isRtl = rtlLocales.includes(locale);
  const formatDate = useDate();
  const [open, setOpen] = useState(false);

  const selected = value ? fromIso(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          'rounded-btn bg-surface flex h-11 w-full items-center gap-3 border px-3 text-start text-sm transition-colors outline-none focus-visible:ring-2',
          invalid
            ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/15'
            : 'border-line-strong hover:border-brand/50 hover:bg-canvas focus-visible:border-brand focus-visible:ring-brand/15',
        )}
      >
        <span className="bg-brand-soft flex size-8 shrink-0 items-center justify-center rounded-lg">
          <CalendarDays className="text-brand size-4" />
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-semibold',
            value ? 'text-ink' : 'text-muted',
          )}
        >
          {value ? formatDate(value) : placeholder}
        </span>
        <ChevronDown className="text-muted size-4 shrink-0" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="border-line w-auto rounded-card border bg-surface p-1.5 shadow-lg"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange(toIso(d));
            setOpen(false);
          }}
          disabled={minDate ? { before: fromIso(minDate) } : undefined}
          locale={isRtl ? ar : enUS}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="rounded-card bg-surface [--cell-size:--spacing(9)]"
        />
      </PopoverContent>
    </Popover>
  );
}
