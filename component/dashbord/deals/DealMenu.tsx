// components/deals/DealMenu.tsx
'use client';

import { FileText, Hourglass, MessageCircleMore, MoreHorizontal, Pencil, Trash2, TrendingDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STAGES, type Deal, type DealStage } from '@/lib/deals/model';
import { cn } from '@/lib/utils';

// القائمة جوه عنصر بيتسحب: بنمنع أحداث الماوس واللمس والكيبورد توصله
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const item =
  'min-h-10 cursor-pointer rounded-btn px-3 py-2 font-semibold focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep';
const dangerItem =
  'text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger min-h-10 cursor-pointer rounded-btn px-3 py-2 font-semibold';

export default function DealMenu({
  deal,
  onMove,
  onEdit,
  onDelete,
  onLose,
  onTouch,
  onInvoice,
}: {
  deal: Deal;
  onMove: (id: string, stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onLose?: (deal: Deal) => void;
  /** A follow-up done now; `awaitingReply`: the customer still has to answer. */
  onTouch?: (deal: Deal, awaitingReply: boolean) => void;
  /** A won deal: start its invoice. */
  onInvoice?: (deal: Deal) => void;
}) {
  const t = useTranslations('Deals');
  const locked = deal.stage === 'won';

  return (
    <div onMouseDown={stop} onTouchStart={stop} onKeyDown={stop}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={t('menu.open')}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'text-muted hover:bg-brand-soft hover:text-brand-deep focus-visible:ring-brand/20 size-8 rounded-lg focus-visible:ring-2',
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="border-line bg-surface text-ink shadow-float rounded-card min-w-48 p-1.5"
        >
          <DropdownMenuItem onClick={() => onEdit(deal)} className={item}>
            <Pencil className="text-muted size-4" aria-hidden="true" />
            {t('menu.edit')}
          </DropdownMenuItem>

          {locked && onInvoice && (
            <DropdownMenuItem onClick={() => onInvoice(deal)} className={item}>
              <FileText className="text-muted size-4" aria-hidden="true" />
              {t('menu.invoice')}
            </DropdownMenuItem>
          )}

          {!locked && onTouch && (
            <>
              <DropdownMenuItem onClick={() => onTouch(deal, false)} className={item}>
                <MessageCircleMore className="text-muted size-4" aria-hidden="true" />
                {t('menu.followedUp')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTouch(deal, true)} className={item}>
                <Hourglass className="text-muted size-4" aria-hidden="true" />
                {t('menu.awaiting')}
              </DropdownMenuItem>
            </>
          )}

          {!locked && (
            <>
              <DropdownMenuSeparator className="my-1.5" />

              <div role="presentation" className="text-muted px-3 py-2 text-[11px] font-bold">
                {t('menu.moveTo')}
              </div>

              {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
                <DropdownMenuItem key={s.key} onClick={() => onMove(deal.id, s.key)} className={item}>
                  <i className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />
                  {t(`stages.${s.key}`)}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="my-1.5" />

              {onLose && (
                <DropdownMenuItem onClick={() => onLose(deal)} className={dangerItem}>
                  <TrendingDown className="size-4" aria-hidden="true" />
                  {t('menu.lose')}
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuItem onClick={() => onDelete(deal)} className={dangerItem}>
            <Trash2 className="size-4" aria-hidden="true" />
            {t('menu.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
