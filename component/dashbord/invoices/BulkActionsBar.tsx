// components/invoices/BulkActionsBar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const base = 'rounded-btn bg-surface h-9 border-2 px-4 text-xs font-bold';
const green = 'border-brand-mint text-brand-deep hover:bg-brand-soft';

export default function BulkActionsBar({
  count,
  remindCount,
  cancelCount,
  onRemind,
  onCancel,
  onExport,
}: {
  count: number;
  // عدد الفواتير اللي ينفع يتبعتلها تذكير أو تتلغي من المختارة
  remindCount: number;
  cancelCount: number;
  onRemind: () => void;
  onCancel: () => void;
  onExport: () => void;
}) {
  const t = useTranslations('Invoices.bulk');

  return (
    <div className="border-line bg-brand-soft/70 flex flex-wrap items-center gap-2 border-t px-4 py-3">
      <p className="text-brand-deep me-2 text-sm font-bold">
        {t('selected', { count })}
      </p>

      <Button
        variant="outline"
        disabled={remindCount === 0}
        onClick={onRemind}
        className={cn(base, green)}
      >
        {t('remind')}
      </Button>
      <Button variant="outline" onClick={onExport} className={cn(base, green)}>
        {t('export')}
      </Button>

      <Button
        variant="outline"
        disabled={cancelCount === 0}
        onClick={onCancel}
        className={cn(
          base,
          'border-danger/25 text-danger hover:bg-danger-soft hover:text-danger ms-auto',
        )}
      >
        {t('cancel')}
      </Button>
    </div>
  );
}
