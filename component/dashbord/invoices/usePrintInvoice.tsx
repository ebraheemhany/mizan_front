// components/invoices/usePrintInvoice.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { toUiDetail, useFetchInvoice } from '@/lib/invoices/hooks';
import type { InvoiceDetail } from '@/lib/mock/invoice-details';
import { printWithTitle } from '@/lib/print';
import InvoicePrintSheet from './InvoicePrintSheet';

// بيطبع فاتورة معينة من أي مكان (زي الجدول) من غير ما تفتح صفحتها
export function usePrintInvoice() {
  const [target, setTarget] = useState<InvoiceDetail | null>(null);
  const fetchInvoice = useFetchInvoice();
  const errorMessage = useApiErrorMessage();

  useEffect(() => {
    if (!target) return;

    const done = () => setTarget(null);
    window.addEventListener('afterprint', done, { once: true });
    printWithTitle(`Invoice-${target.number}`);

    return () => window.removeEventListener('afterprint', done);
  }, [target]);

  // The list only has the summary, so the full invoice is loaded first.
  const print = async (number: number) => {
    try {
      setTarget(toUiDetail(await fetchInvoice(number)));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  // لازم يتحط في الصفحة اللي بتستخدم الـ hook
  const sheet = target ? <InvoicePrintSheet invoice={target} /> : null;

  return { print, sheet };
}
