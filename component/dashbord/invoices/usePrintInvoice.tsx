// components/invoices/usePrintInvoice.tsx
'use client';

import { useEffect, useState } from 'react';
import { getInvoiceDetail, type InvoiceDetail } from '@/lib/mock/invoice-details';
import { printWithTitle } from '@/lib/print';
import InvoicePrintSheet from './InvoicePrintSheet';

// بيطبع فاتورة معينة من أي مكان (زي الجدول) من غير ما تفتح صفحتها
export function usePrintInvoice() {
  const [target, setTarget] = useState<InvoiceDetail | null>(null);

  useEffect(() => {
    if (!target) return;

    const done = () => setTarget(null);
    window.addEventListener('afterprint', done, { once: true });
    printWithTitle(`Invoice-${target.number}`);

    return () => window.removeEventListener('afterprint', done);
  }, [target]);

  // TODO: لما نربط الـ API هنجيب بيانات الفاتورة من الباك إند
  const print = (number: number) => setTarget(getInvoiceDetail(number) ?? null);

  // لازم يتحط في الصفحة اللي بتستخدم الـ hook
  const sheet = target ? <InvoicePrintSheet invoice={target} /> : null;

  return { print, sheet };
}