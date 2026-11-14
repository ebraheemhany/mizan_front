// components/recurring/RecurringTable.tsx
'use client';

import { MoreHorizontal, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { thClass } from '@/component/table-styles';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useRouter } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import { MOCK_NOW } from '@/lib/mock/invoices';
import type { RecurringInvoice, RecurringStatus } from '@/lib/mock/recurring';
import { useMoney } from '@/lib/money';
import { daysUntil, formatDaysFromNow } from '@/lib/relative-time';
import { cn } from '@/lib/utils';

const BADGE: Record<RecurringStatus, string> = {
  active: 'bg-brand-soft text-brand-deep',
  paused: 'bg-amber-100 text-amber-800',
  ended: 'bg-neutral-soft text-muted',
};

export default function RecurringTable({
  rows,
  onToggle,
  onDelete,
}: {
  rows: RecurringInvoice[];
  onToggle: (id: string) => void;
  onDelete: (row: RecurringInvoice) => void;
}) {
  const t = useTranslations('Recurring');
  const locale = useLocale();
  const router = useRouter();
  const money = useMoney();
  const date = useDate();

  return (
    <div className="border-line overflow-x-auto border-t">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-canvas/60">
          <tr>
            <th className={thClass}>{t('columns.template')}</th>
            <th className={thClass}>{t('columns.frequency')}</th>
            <th className={thClass}>{t('columns.amount')}</th>
            <th className={thClass}>{t('columns.next')}</th>
            <th className={thClass}>{t('columns.generated')}</th>
            <th className={thClass}>{t('columns.status')}</th>
            <th className="w-12 px-4 py-3">
              <span className="sr-only">{t('actions.open')}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const showNext = r.status === 'active' && r.nextDate;

            return (
              <tr
                key={r.id}
                className="border-line hover:bg-canvas/50 border-t transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/recurring/${r.id}/edit`}
                    className={cn(
                      'font-bold hover:underline',
                      r.status === 'ended' ? 'text-muted' : 'text-ink',
                    )}
                  >
                    {r.name}
                  </Link>
                  <p className="text-muted mt-0.5 text-xs">{r.customer}</p>
                  <p
                    className={cn(
                      'mt-1 text-[11px] font-semibold',
                      r.autoSend ? 'text-brand-deep' : 'text-muted',
                    )}
                  >
                    {t(r.autoSend ? 'autoSend' : 'autoDraft')}
                  </p>
                </td>

                <td className="text-body px-4 py-3 whitespace-nowrap">
                  {t(`frequency.${r.frequency}`)}
                </td>

                <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">
                  {money(r.amount)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {showNext && r.nextDate ? (
                    <>
                      <p className="text-ink font-semibold">
                        {date(r.nextDate)}
                      </p>
                      <p className="text-muted text-xs">
                        {formatDaysFromNow(
                          locale,
                          daysUntil(r.nextDate, MOCK_NOW),
                        )}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>

                <td className="text-body px-4 py-3 whitespace-nowrap">
                  {t('generated', { count: r.generatedCount })}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
                      BADGE[r.status],
                    )}
                  >
                    <i className="size-1.5 rounded-full bg-current" />
                    {t(`status.${r.status}`)}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      aria-label={t('actions.open')}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'size-8',
                      )}
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="border-line bg-surface text-ink shadow-float min-w-56 rounded-card p-1.5"
                    >
                      {r.status !== 'ended' && (
                        <DropdownMenuItem
                          onClick={() => onToggle(r.id)}
                          className="min-h-10 rounded-btn px-3 py-2 font-semibold text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                        >
                          {r.status === 'active' ? (
                            <Pause
                              className="text-muted size-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <Play
                              className="text-muted size-4"
                              aria-hidden="true"
                            />
                          )}
                          {t(r.status === 'active' ? 'pause' : 'resume', {
                            name: r.name,
                          })}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/invoices/recurring/${r.id}/edit`)
                        }
                        className="min-h-10 rounded-btn px-3 py-2 font-semibold text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        <Pencil
                          className="text-muted size-4"
                          aria-hidden="true"
                        />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(r)}
                        className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger min-h-10 rounded-btn px-3 py-2 font-semibold"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
