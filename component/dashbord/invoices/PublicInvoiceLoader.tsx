// components/invoices/PublicInvoiceLoader.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Logo from '@/component/Logo';
import { toUiDetail, usePublicInvoice } from '@/lib/invoices/hooks';
import { CurrencyProvider } from '@/lib/money';
import PublicInvoiceView from './PublicInvoiceView';
import PublicPayPanel from './PublicPayPanel';

/** The customer's view of an invoice, opened from its link (no login). */
export default function PublicInvoiceLoader({ token }: { token: string }) {
  const t = useTranslations('InvoicesApi');
  const query = usePublicInvoice(token);

  if (query.isPending) {
    return (
      <div className="bg-canvas text-muted flex min-h-dvh items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="bg-canvas flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo />
        <h1 className="text-ink text-lg font-extrabold">{t('notFoundTitle')}</h1>
      </div>
    );
  }
  const { invoice, pay } = query.data;
  // No session here: the amounts are in the invoice's currency (its company's).
  return (
    <CurrencyProvider currency={invoice.currency}>
      <PublicInvoiceView
        invoice={toUiDetail(invoice)}
        displayNumber={invoice.displayNumber}
        payment={<PublicPayPanel token={token} pay={pay} status={invoice.status} issueDate={invoice.issueDate} />}
      />
    </CurrencyProvider>
  );
}
