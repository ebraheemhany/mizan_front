// components/app/form-parts.tsx
'use client';

import { cn } from '@/lib/utils';

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm sm:p-6">
      <div className="border-line border-b pb-3">
        <h2 className="text-ink text-base font-extrabold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs font-semibold">
      {message}
    </p>
  );
}

// أزرار اختيار واحد من كذا (زي التكرار وشروط الدفع)
export function ChipGroup<T extends string | number>({
  labelId,
  value,
  options,
  onChange,
  className,
}: {
  labelId: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-4', className)}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-btn h-10 border text-xs font-bold transition-colors outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15',
              selected
                ? 'border-brand bg-brand-soft text-brand-deep'
                : 'border-line-strong bg-surface text-ink-2 hover:border-brand/50 hover:bg-canvas',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
