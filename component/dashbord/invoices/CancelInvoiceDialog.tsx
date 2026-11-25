// components/invoices/CancelInvoiceDialog.tsx
'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ConfirmDialog from '@/component/ConfirmDialog';
import type { Invoice } from '@/lib/mock/invoices';

export default function CancelInvoiceDialog({
  invoices,
  onConfirm,
  onClose,
}: {
  invoices: Invoice[] | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('Invoices.cancelDialog');
  const singleInvoice = invoices?.length === 1 ? invoices[0] : null;

  return (
    <ConfirmDialog
      open={!!invoices?.length}
      icon={TriangleAlert}
      title={
        singleInvoice
          ? t('title', { number: String(singleInvoice.number) })
          : t('bulkTitle', { count: invoices?.length ?? 0 })
      }
      description={singleInvoice ? t('description', { customer: singleInvoice.customer }) : t('bulkDescription')}
      cancelLabel={t('keep')}
      confirmLabel={t('confirm')}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
