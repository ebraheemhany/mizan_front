// component/dashbord/reports/StatementSection.tsx
import { cn } from '@/lib/utils';

export type StatementRow = { key: string; amount: number };

export default function StatementSection({
  title,
  rows,
  totalLabel,
  total,
  money,
  label,
}: {
  title: string;
  rows: StatementRow[];
  totalLabel: string;
  total: number;
  money: (value: number) => string;
  label: (key: string) => string;
}) {
  return (
    <div className="rounded-card border-line bg-surface flex flex-col border p-5 shadow-sm">
      <h2 className="text-ink text-sm font-extrabold">{title}</h2>

      <ul className="mt-4 flex-1">
        {rows.map((row) => (
          <li
            key={row.key}
            className="border-line/70 flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
          >
            <span className="text-ink-2 text-xs font-semibold">
              {label(row.key)}
            </span>
            <span
              className={cn(
                'text-ink text-xs font-bold tabular-nums',
                row.amount < 0 && 'text-danger',
              )}
            >
              {money(row.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-line-strong flex items-center justify-between gap-4 border-t pt-4">
        <span className="text-ink text-sm font-extrabold">{totalLabel}</span>
        <span
          className={cn(
            'text-lg font-extrabold tabular-nums',
            total < 0 ? 'text-danger' : 'text-brand',
          )}
        >
          {money(total)}
        </span>
      </div>
    </div>
  );
}