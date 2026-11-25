// components/invoices/LedgerSheet.tsx
'use client';

import { useMemo } from 'react';
import { BookOpenText, Check, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { rtlLocales } from '@/i18n/routing';
import {
  ACCOUNT_CODES,
  buildJournalEntries,
  type JournalEntry,
} from '@/lib/accounting';
import { useDate } from '@/lib/data';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

const th =
  'text-muted px-2 py-2.5 text-start text-[11px] font-bold whitespace-nowrap sm:px-4 sm:text-xs';

function EntryCard({ entry }: { entry: JournalEntry }) {
  const t = useTranslations('InvoiceDetail.ledger');
  const money = useMoney();
  const date = useDate();

  const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);
  // Compared in cents: summing decimals as numbers can leave a tiny float difference.
  const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100);

  const amount = (v: number) =>
    v === 0 ? <span className="text-muted">—</span> : money(v);

  return (
    <section className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
      <header className="bg-brand-soft/60 border-line flex items-start justify-between gap-3 border-b px-4 py-4">
        <div className="min-w-0">
          <h3 className="text-ink text-sm font-extrabold leading-6">
            {t(`entries.${entry.kind}`)}
          </h3>
          <p className="text-muted mt-1 text-xs">
            {date(entry.date)} ·{' '}
            <span dir="ltr" className="inline-block tabular-nums">
              {entry.reference}
            </span>
          </p>
        </div>

        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold',
            balanced
              ? 'border-brand/15 bg-surface text-brand-deep'
              : 'border-danger/15 bg-danger-soft text-danger',
          )}
        >
          {balanced && <Check className="size-3" />}
          {t(balanced ? 'balanced' : 'unbalanced')}
        </span>
      </header>

      <div>
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead>
            <tr className="bg-canvas/60 border-line border-y">
              <th className={cn(th, 'w-[44%]')}>{t('columns.account')}</th>
              <th className={cn(th, 'w-[28%]')}>{t('columns.debit')}</th>
              <th className={cn(th, 'w-[28%]')}>{t('columns.credit')}</th>
            </tr>
          </thead>

          <tbody>
            {entry.lines.map((line, i) => (
              <tr
                key={`${line.account}-${i}`}
                className="border-line border-t first:border-t-0"
              >
                {/* الحساب الدائن بيتحط بإزاحة زي الدفاتر */}
                <td
                  className={cn(
                    'px-2 py-3 sm:px-4',
                    line.debit === 0 && 'ps-5 sm:ps-9',
                  )}
                >
                  <p className="text-ink font-bold">
                    {t(`accounts.${line.account}`)}
                  </p>
                  <p className="text-muted text-[11px]">
                    <span dir="ltr" className="inline-block tabular-nums">
                      {ACCOUNT_CODES[line.account]}
                    </span>
                  </p>
                </td>
                <td className="text-ink px-2 py-3 text-[11px] font-bold whitespace-nowrap tabular-nums sm:px-4 sm:text-sm">
                  {amount(line.debit)}
                </td>
                <td className="text-ink px-2 py-3 text-[11px] font-bold whitespace-nowrap tabular-nums sm:px-4 sm:text-sm">
                  {amount(line.credit)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-line bg-brand-soft/50 border-t">
              <td className="text-ink px-2 py-3 text-[11px] font-extrabold sm:px-4 sm:text-xs">
                {t('total')}
              </td>
              <td className="text-ink px-2 py-3 text-[11px] font-extrabold whitespace-nowrap tabular-nums sm:px-4 sm:text-sm">
                {money(totalDebit)}
              </td>
              <td className="text-ink px-2 py-3 text-[11px] font-extrabold whitespace-nowrap tabular-nums sm:px-4 sm:text-sm">
                {money(totalCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default function LedgerSheet({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDetail;
}) {
  const t = useTranslations('InvoiceDetail.ledger');
  const locale = useLocale();

  // بيتحسب من جديد كل ما الفاتورة تتغير (مثلاً بعد تسجيل دفعة)
  const entries = useMemo(() => buildJournalEntries(invoice), [invoice]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        // بيفتح من جهة نهاية الصفحة: شمال في العربي ويمين في الإنجليزي
        side={rtlLocales.includes(locale) ? 'left' : 'right'}
        showCloseButton={false}
        className="border-line bg-surface text-ink shadow-float w-full gap-0 border p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-line bg-brand-soft/60 relative shrink-0 flex-row items-center gap-3.5 border-b px-6 py-5 text-start">
          <span className="bg-surface text-brand ring-brand/10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
            <BookOpenText className="size-5" />
          </span>

          <div className="min-w-0 pe-8">
            <SheetTitle className="text-ink text-lg font-extrabold">
              {t('title')}
            </SheetTitle>
            <SheetDescription className="text-muted mt-1 truncate text-xs">
              {t('description', { number: String(invoice.number) })}
            </SheetDescription>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('close')}
            className="text-muted hover:bg-surface hover:text-ink focus-visible:ring-brand/30 absolute end-4 top-4 rounded-lg p-1.5 transition-colors outline-none focus-visible:ring-2"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <div className="bg-canvas/40 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4 [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] sm:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-brand">
          {entries.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm leading-7">
              {t('empty')}
            </p>
          ) : (
            entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
