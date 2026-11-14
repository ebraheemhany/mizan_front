// components/app/StatCard.tsx
import { cn } from '@/lib/utils';

export type StatTone = 'default' | 'danger' | 'brand' | 'warning';

const VALUE: Record<StatTone, string> = {
  default: 'text-ink',
  danger: 'text-danger',
  brand: 'text-brand',
  warning: 'text-amber-600',
};

const HINT: Record<StatTone, string> = {
  default: 'text-muted',
  danger: 'text-danger',
  brand: 'text-brand-deep',
  warning: 'text-amber-700',
};

export default function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  hintTone,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  tone?: StatTone;
  /** لون سطر التلميح لو مختلف عن لون الرقم */
  hintTone?: StatTone;
}) {
  return (
    <div className="rounded-card border-line bg-surface border p-4 sm:p-5">
      <p className="text-muted text-xs font-semibold">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl',
          VALUE[tone],
        )}
      >
        {value}
      </p>
      <p className={cn('mt-1.5 text-xs font-semibold', HINT[hintTone ?? tone])}>
        {hint}
      </p>
    </div>
  );
}
