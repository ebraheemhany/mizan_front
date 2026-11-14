// component/dashbord/customers/BulkActionsBar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Owner } from '@/lib/mock/customers';

const base = 'rounded-btn bg-surface h-9 border-2 px-4 text-xs font-bold';
const green = 'border-brand-mint text-brand-deep hover:bg-brand-soft';

export default function BulkActionsBar({
  count,
  owners,
  onRemind,
  onAssign,
  onExport,
  onDelete,
}: {
  count: number;
  owners: Owner[];
  onRemind: () => void;
  onAssign: (ownerId: string) => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('Customers.bulk');

  return (
    <div className="border-line bg-brand-soft/70 flex flex-wrap items-center gap-2 border-t px-4 py-3">
      <p className="text-brand-deep me-2 text-sm font-bold">
        {t('selected', { count })}
      </p>

      <Button variant="outline" onClick={onRemind} className={cn(base, green)}>
        {t('remind')}
      </Button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className={cn(
            base,
            green,
            'group inline-flex items-center gap-1.5 border-solid transition-colors outline-none',
          )}
        >
          {t('assign')}
          <ChevronDown className="size-3.5 transition-transform group-data-popup-open:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="border-line bg-surface min-w-44 rounded-xl p-1 shadow-lg"
        >
          {owners.map((owner) => (
            <DropdownMenuItem
              key={owner.id}
              onClick={() => onAssign(owner.id)}
              className="text-ink-2 data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer rounded-lg px-3 text-xs font-semibold"
            >
              {owner.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={onExport} className={cn(base, green)}>
        {t('export')}
      </Button>

      <Button
        variant="outline"
        onClick={onDelete}
        className={cn(
          base,
          'border-danger/25 text-danger hover:bg-danger-soft hover:text-danger ms-auto',
        )}
      >
        {t('delete')}
      </Button>
    </div>
  );
}
