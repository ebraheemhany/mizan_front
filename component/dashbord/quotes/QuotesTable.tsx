// components/quotes/QuotesTable.tsx
'use client';

import {
  Check,
  Copy,
  Eye,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
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
import { Link, useRouter } from '@/i18n/navigation';
import { useDate } from '@/lib/data';
import { useMoney } from '@/lib/money';
import { displayStatus, type Quote } from '@/lib/quotes/hooks';
import { cn } from '@/lib/utils';
import QuoteStatusBadge from './QuoteStatusBadge';
import type { QuoteActions } from './useQuoteActions';

const itemClass =
  'rounded-btn focus:bg-brand-soft focus:text-brand-deep data-highlighted:bg-brand-soft data-highlighted:text-brand-deep min-h-10 cursor-pointer px-3 py-2 font-semibold';
const dangerItemClass =
  'text-danger focus:bg-danger-soft focus:text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger rounded-btn min-h-10 cursor-pointer px-3 py-2 font-semibold';

export default function QuotesTable({
  rows,
  allowed,
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
  /** Which actions the current user may use on each quote. */
  allowed: QuoteActions['allowed'];
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
  const tApi = useTranslations('QuotesApi');
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
            const expiring = displayStatus(q) === 'expiringSoon';
            const decide = allowed.decide(q);
            const share = allowed.share(q);

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
                    {q.displayNumber}
                  </Link>
                </td>

                <td className="text-ink-2 px-4 py-3 font-semibold">{q.customer}</td>

                <td className="text-muted px-4 py-3 whitespace-nowrap">{date(q.issueDate)}</td>

                <td
                  className={cn(
                    'px-4 py-3 whitespace-nowrap',
                    expiring ? 'font-bold text-amber-700' : 'text-muted',
                  )}
                >
                  {date(q.validUntil)}
                </td>

                <td className="text-ink px-4 py-3 font-bold whitespace-nowrap tabular-nums">{money(q.total)}</td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <QuoteStatusBadge quote={q} />
                    {q.invoice && (
                      <Link
                        href={`/invoices/${q.invoice.number}`}
                        dir="ltr"
                        title={tApi('convertedTo', { number: q.invoice.displayNumber })}
                        className="text-brand-deep inline-flex items-center gap-1 text-[11px] font-bold whitespace-nowrap hover:underline"
                      >
                        <FileText className="size-3" aria-hidden="true" />
                        {q.invoice.displayNumber}
                      </Link>
                    )}
                  </div>
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
                      <DropdownMenuItem onClick={() => router.push(`/quotes/${q.number}`)} className={itemClass}>
                        <Eye className="text-muted size-4" aria-hidden="true" />
                        {t('actions.view')}
                      </DropdownMenuItem>

                      {allowed.edit(q) && (
                        <DropdownMenuItem onClick={() => onEdit(q)} className={itemClass}>
                          <Pencil className="text-muted size-4" aria-hidden="true" />
                          {t('actions.edit')}
                        </DropdownMenuItem>
                      )}
                      {allowed.send(q) && (
                        <DropdownMenuItem onClick={() => onSend(q)} className={itemClass}>
                          <Send className="text-muted size-4" aria-hidden="true" />
                          {t('actions.send')}
                        </DropdownMenuItem>
                      )}

                      {decide && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <div role="presentation" className="text-muted px-3 py-2 text-[11px] font-bold">
                            {t('actions.statusActions')}
                          </div>
                          <DropdownMenuItem
                            onClick={() => onAccept(q)}
                            className={cn(itemClass, 'text-brand-deep min-h-11')}
                          >
                            <span className="bg-brand-soft flex size-7 items-center justify-center rounded-lg">
                              <Check className="text-brand-deep size-4" aria-hidden="true" />
                            </span>
                            {t('actions.accept')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReject(q)} className={cn(dangerItemClass, 'min-h-11')}>
                            <span className="bg-danger-soft flex size-7 items-center justify-center rounded-lg">
                              <X className="size-4" aria-hidden="true" />
                            </span>
                            {t('actions.reject')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1.5" />
                        </>
                      )}

                      {share && (
                        <DropdownMenuItem onClick={() => onShare(q)} className={itemClass}>
                          <Link2 className="text-muted size-4" aria-hidden="true" />
                          {t('actions.copyCustomerLink')}
                        </DropdownMenuItem>
                      )}

                      {allowed.convert(q) && (
                        <DropdownMenuItem onClick={() => onConvert(q)} className={itemClass}>
                          <Receipt className="text-muted size-4" aria-hidden="true" />
                          {t('actions.convert')}
                        </DropdownMenuItem>
                      )}

                      {q.invoice && (
                        <DropdownMenuItem
                          onClick={() => router.push(`/invoices/${q.invoice?.number}`)}
                          className={itemClass}
                        >
                          <FileText className="text-muted size-4" aria-hidden="true" />
                          {tApi('viewInvoice', { number: q.invoice.displayNumber })}
                        </DropdownMenuItem>
                      )}

                      {allowed.duplicate() && (
                        <DropdownMenuItem onClick={() => onDuplicate(q)} className={itemClass}>
                          <Copy className="text-muted size-4" aria-hidden="true" />
                          {t('actions.duplicate')}
                        </DropdownMenuItem>
                      )}

                      {allowed.delete(q) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(q)} className={dangerItemClass}>
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
