// components/invoices/InvoicePrintSheet.tsx
'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import InvoiceDocument from './InvoiceDocument';
import StatusBadge from './StatusBadge';

const subscribe = () => () => {};

export default function InvoicePrintSheet({
  invoice,
}: {
  invoice: InvoiceDetail;
}) {
  const t = useTranslations('InvoiceDetail');
  const tf = useTranslations('Footer');

  // بيرجّع false على السيرفر وtrue في المتصفح، علشان الـ portal ما يتعملش إلا في المتصفح
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(
    <div id="print-root" className="text-ink hidden">
      <header className="border-ink flex items-center justify-between gap-6 border-b-2 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-brand flex size-9 items-center justify-center rounded-[11px] text-white">
            <Scale className="size-5" />
          </span>
          <span className="text-xl font-extrabold">{tf('brandName')}</span>
        </div>

        <div className="text-end">
          <p className="text-2xl font-extrabold">
            {t('title')}{' '}
            <span dir="ltr" className="inline-block">
              #{invoice.number}
            </span>
          </p>
          <div className="mt-1.5">
            <StatusBadge
              status={invoice.status}
              daysOverdue={invoice.daysOverdue}
            />
          </div>
        </div>
      </header>

      <InvoiceDocument
        invoice={invoice}
        className="mt-6 border-0 p-0 shadow-none sm:p-0"
      />

      <p className="text-muted border-line mt-8 border-t pt-3 text-center text-[11px]">
        {t('print.footer')}
      </p>
    </div>,
    document.body,
  );
}
