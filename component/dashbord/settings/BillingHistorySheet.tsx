// component/dashbord/settings/BillingHistorySheet.tsx
'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { CalendarDays, Download, Loader2, ReceiptText, X } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useMoney } from '@/lib/money';
import { useBillingPayments, type BillingPayment } from '@/lib/billing/hooks';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const STATUS_STYLES: Record<BillingPayment['status'], string> = {
  paid: 'bg-brand-soft text-brand-deep',
  pending: 'bg-neutral-soft text-ink-2',
  failed: 'bg-danger-soft text-danger',
};

type Props = { open: boolean; onClose: () => void };

export function BillingHistorySheet({ open, onClose }: Props) {
  const t = useTranslations('Settings.subscription');
  const locale = useLocale();
  const format = useFormatter();
  const money = useMoney();
  // Loaded when the sheet opens (the owner's payments to Paymob).
  const payments = useBillingPayments(open);
  const items = payments.data ?? [];
  const describe = (p: BillingPayment) =>
    t(`history.items.${p.kind}`, { plan: t(`plans.${p.plan}`) });

  const fmtDate = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    });

  function downloadInvoice(invoice: BillingPayment) {
    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };
        return entities[character];
      });

    const invoiceNumber = escapeHtml(invoice.number);
    const description = escapeHtml(describe(invoice));
    const date = escapeHtml(fmtDate(invoice.paidAt ?? invoice.createdAt));
    const status = escapeHtml(t(`history.status.${invoice.status}`));
    const amount = escapeHtml(money(Number(invoice.amount)));
    const title = escapeHtml(t('history.invoiceTitle'));
    const dateLabel = escapeHtml(t('history.date'));
    const totalLabel = escapeHtml(t('history.total'));
    const statusLabel = escapeHtml(t('history.statusLabel'));
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    const html = `<!doctype html>
<html lang="${locale}" dir="${direction}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} ${invoiceNumber}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 48px 24px; color: #172033; background: #f5f7fa; font-family: Arial, sans-serif; }
      main { max-width: 680px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background: #fff; }
      header { padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
      h1 { margin: 0 0 12px; color: #137c68; font-size: 24px; }
      .number { color: #172033; font-size: 14px; font-weight: 700; }
      .description { margin: 8px 0 0; color: #667085; }
      dl { margin: 24px 0 0; }
      .row { display: flex; justify-content: space-between; gap: 20px; padding: 16px 0; border-bottom: 1px solid #eef0f3; }
      dt { color: #667085; }
      dd { margin: 0; font-weight: 700; text-align: end; }
      .total dd { color: #137c68; font-size: 20px; }
      @media print { body { padding: 0; background: #fff; } main { border: 0; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${title}</h1>
        <div class="number">${invoiceNumber}</div>
        <p class="description">${description}</p>
      </header>
      <dl>
        <div class="row"><dt>${dateLabel}</dt><dd>${date}</dd></div>
        <div class="row"><dt>${statusLabel}</dt><dd>${status}</dd></div>
        <div class="row total"><dt>${totalLabel}</dt><dd>${amount}</dd></div>
      </dl>
    </main>
  </body>
</html>`;

    let url: string | undefined;
    try {
      const downloadUrl = URL.createObjectURL(
        new Blob([html], { type: 'text/html;charset=utf-8' }),
      );
      url = downloadUrl;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${invoice.number.replace(/[^a-zA-Z0-9._-]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      toast.success(t('history.downloadStarted'));
    } catch {
      if (url) URL.revokeObjectURL(url);
      toast.error(t('history.downloadFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        showCloseButton={false}
        className="border-line bg-surface text-ink w-full gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetClose
          aria-label={t('history.close')}
          className="text-muted hover:bg-neutral-soft hover:text-ink focus-visible:ring-brand absolute end-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden="true" />
        </SheetClose>
        <SheetHeader className="border-line bg-canvas/40 gap-3 border-b p-6 pe-14 text-start">
          <span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-2xl">
            <ReceiptText className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <SheetTitle className="text-ink text-lg font-extrabold">
              {t('history.title')}
            </SheetTitle>
            <SheetDescription className="text-muted text-sm leading-6">
              {t('history.description')}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div
          role="list"
          aria-label={t('history.title')}
          className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5"
        >
          {payments.isPending ? (
            <div className="text-muted flex justify-center py-16">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="bg-neutral-soft text-muted flex size-14 items-center justify-center rounded-2xl">
                <ReceiptText className="size-6" aria-hidden="true" />
              </span>
              <p className="text-muted text-sm">{t('history.empty')}</p>
            </div>
          ) : (
            items.map((inv) => (
              <div
                key={inv.id}
                role="listitem"
                className="rounded-card border-line bg-surface hover:border-brand/25 flex flex-col gap-4 border p-4 shadow-sm transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-start">
                    <p dir="auto" className="text-ink text-sm font-extrabold">
                      {inv.number}
                    </p>
                    <p className="text-muted mt-1 text-xs">{describe(inv)}</p>
                    {inv.periodStart && inv.periodEnd && (
                      <p className="text-muted mt-0.5 text-[11px]">
                        {t('history.period', {
                          from: fmtDate(inv.periodStart),
                          to: fmtDate(inv.periodEnd),
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-ink shrink-0 text-sm font-extrabold">
                    {money(Number(inv.amount))}
                  </span>
                </div>

                <div className="border-line flex items-center justify-between gap-3 border-t pt-3">
                  <span className="text-muted flex min-w-0 items-center gap-1.5 text-xs">
                    <CalendarDays
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{fmtDate(inv.paidAt ?? inv.createdAt)}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-bold',
                        STATUS_STYLES[inv.status],
                      )}
                    >
                      {t(`history.status.${inv.status}`)}
                    </span>
                    {inv.status === 'paid' && (
                      <button
                        type="button"
                        aria-label={`${t('history.download')} ${inv.number}`}
                        onClick={() => downloadInvoice(inv)}
                        className="border-line-strong text-ink-2 hover:border-brand/30 hover:bg-brand-soft hover:text-brand focus-visible:ring-brand/20 rounded-btn flex size-9 items-center justify-center border transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Download className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
