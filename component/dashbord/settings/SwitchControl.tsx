// component/dashbord/settings/SwitchControl.tsx
'use client';

import { cn } from '@/lib/utils';

export default function SwitchControl({
  checked,
  onChange,
  labelledBy,
  ariaLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const on = checked && !disabled;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        'focus-visible:ring-brand/30 relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed',
        on ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'absolute start-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
          on && 'ltr:translate-x-5 rtl:-translate-x-5',
        )}
      />
    </button>
  );
}