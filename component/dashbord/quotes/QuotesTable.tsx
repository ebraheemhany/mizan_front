// components/quotes/QuotesTable.tsx
'use client';

import {
  Check,
  Copy,
  Eye,
  Pencil,
  MoreHorizontal,
  Receipt,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { thClass } from '@/component/table-styles';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDate } from '@/lib/data';
import {
  displayStatus,
  effectiveStatus,
  quoteLabel,
  type Quote,
} from '@/lib/mock/quotes';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/i18n/navigation';
import QuoteStatusBadge from './QuoteStatusBadge';

export default function QuotesTable({
  rows,
  onSend,
  onAccept,
  onReject,
  onConvert,
  onShare,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  rows: Quote[];
  onSend: (q: Quote) => void;
  onAccept: (q: Quote) => void;
  onReject: (q: Quote) => void;
  onConvert: (q: Quote) => void;
  onShare: (q: Quote) => void;
  onEdit: (q: Quote) => void;
  onDuplicate: (q: Quote) => void;
  onDelete: (q: Quote) => void;
}) {
  const t = useTranslations('Quotes');
  const money = useMoney();
  const date = useDate();
  const router = useRouter();

  return (
    <div className="border-line overflow-x-auto border-t">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-canvas/60">
          <tr>
            <th className={thClass}>{t('columns.number')}</th>
            <th className={thClass}>{t('columns.customer')}</th>
            <th className={thClass}>{t('columns.date')}</th>
            <th className={thClass}>{t('columns.validUntil')}</th>
            <th className={thClass}>{t('columns.total')}</th>
            <th className={thClass}>{t('columns.status')}</th>
            <th className="w-12 px-4 py-3">
              <span className="sr-only">{t('actions.open')}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((q) => {
            const status = effectiveStatus(q);
            const expiring = displayStatus(q) === 'expiringSoon';

            return (
              <tr
                key={q.id}
                onClick={(e) => {
                  // الضغط على رابط أو زرار (زي القائمة) بيشتغل لوحده
                  if ((e.target as HTMLElement).closest('a, button')) return;
                  router.push(`/quotes/${q.number}`);
                }}
                className="border-line hover:bg-canvas/50 cursor-pointer border-t transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/quotes/${q.number}`}
                    dir="ltr"
                    className="text-brand inline-block font-extrabold tabular-nums hover:underline"
                  >
                    #{quoteLabel(q.number)}
                  </Link>
                </td>

                <td className="text-ink-2 px-4 py-3 font-semibold">
                  {q.customer}
                </td>

                <td className="text-muted px-4 py-3 whitespace-nowrap">
                  {date(q.issueDate)}
                </td>

                <td
                  className={cn(
                    'px-4 py-3 whitespace-nowrap',
                    expiring ? 'font-bold text-amber-700' : 'text-muted',
                  )}
                >
                  {date(q.validUntil)}
                </td>

                <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">
                  {money(q.total)}
                </td>

                <td className="px-4 py-3">
                  <QuoteStatusBadge quote={q} />
                </td>

                <td className="px-4 py-3">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      aria-label={t('actions.open')}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'text-muted hover:bg-brand-soft hover:text-brand-deep focus-visible:ring-brand/20 size-8 rounded-lg focus-visible:ring-2',
                      )}
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="start"
                      className="border-line bg-surface text-ink shadow-float rounded-card min-w-56 p-1.5"
                    >
                      <DropdownMenuItem
                        onClick={() => router.push(`/quotes/${q.number}`)}
                        className="min-h-10 rounded-btn px-3 py-2 font-semibold text-ink focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep"
                      >
                        <Eye className="text-muted size-4" aria-hidden="true" />
                        {t('actions.view')}
                      </DropdownMenuItem>

                      {status === 'draft' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onEdit(q)}
                            className="rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 font-semibold"
                          >
                            <Pencil
                              className="text-muted size-4"
                              aria-hidden="true"
                            />
                            {t('actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onSend(q)}
                            className="rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 font-semibold"
                          >
                            <Send
                              className="text-muted size-4"
                              aria-hidden="true"
                            />
                            {t('actions.send')}
                          </DropdownMenuItem>
                        </>
                      )}

                      {status === 'sent' && (
                        <>
                          <div
                            role="presentation"
                            className="text-muted px-3 py-2 text-[11px] font-bold"
                          >
                            {t('actions.statusActions')}
                          </div>
                          <DropdownMenuItem
                            onClick={() => onAccept(q)}
                            className="text-brand-deep rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-11 cursor-pointer px-3 py-2 font-semibold"
                          >
                            <span className="bg-brand-soft flex size-7 items-center justify-center rounded-lg">
                              <Check
                                className="text-brand-deep size-4"
                                aria-hidden="true"
                              />
                            </span>
                            {t('actions.accept')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onReject(q)}
                            className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger rounded-btn min-h-11 cursor-pointer px-3 py-2 font-semibold"
                          >
                            <span className="bg-danger-soft flex size-7 items-center justify-center rounded-lg">
                              <X className="size-4" aria-hidden="true" />
                            </span>
                            {t('actions.reject')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onShare(q)}
                            className="rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 font-semibold"
                          >
                            <Copy
                              className="text-muted size-4"
                              aria-hidden="true"
                            />
                            {t('actions.copyCustomerLink')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1.5" />
                        </>
                      )}

                      {status === 'accepted' && (
                        <DropdownMenuItem
                          onClick={() => onConvert(q)}
                          className="rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 font-semibold"
                        >
                          <Receipt
                            className="text-muted size-4"
                            aria-hidden="true"
                          />
                          {t('actions.convert')}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => onDuplicate(q)}
                        className="rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 font-semibold"
                      >
                        <Copy
                          className="text-muted size-4"
                          aria-hidden="true"
                        />
                        {t('actions.duplicate')}
                      </DropdownMenuItem>

                      {status === 'draft' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(q)}
                            className="text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger rounded-btn min-h-10 cursor-pointer px-3 py-2 font-semibold"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </>
                      )}
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
