// components/invoices/PublicInvoiceView.tsx
'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { printWithTitle } from '@/lib/print';
import InvoiceDocument from './InvoiceDocument';
import InvoicePrintSheet from './InvoicePrintSheet';
import StatusBadge from './StatusBadge';
import Logo from '@/component/Logo';

export default function PublicInvoiceView({
  invoice,
  displayNumber,
}: {
  invoice: InvoiceDetail;
  displayNumber: string;
}) {
  const t = useTranslations('InvoiceDetail');
  const tApi = useTranslations('InvoicesApi');

  return (
    <div className="bg-canvas min-h-dvh">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />

          <Button
            variant="outline"
            onClick={() => printWithTitle(`Invoice-${invoice.number}`)}
            className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold"
          >
            <Download className="size-4" />
            {t('downloadPdf')}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-ink text-2xl font-extrabold sm:text-3xl">
              {t('title')}{' '}
              <span dir="ltr" className="inline-block">
                {displayNumber}
              </span>
            </h1>
            <p className="text-muted mt-1 text-xs">{tApi('issuedBy', { name: invoice.issuer.name })}</p>
          </div>

          <StatusBadge status={invoice.status} daysOverdue={invoice.daysOverdue} />
        </div>

        <InvoiceDocument invoice={invoice} />

        <p className="text-muted pt-2 text-center text-xs">{t('print.footer')}</p>
      </main>

      {/* نسخة الطباعة: مخفية على الشاشة وبتظهر وقت الطباعة بس */}
      <InvoicePrintSheet invoice={invoice} />
    </div>
  );
}