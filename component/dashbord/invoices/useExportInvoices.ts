// components/invoices/useExportInvoices.ts
'use client';

import { useTranslations } from 'next-intl';
import { downloadCsv, type CsvColumn } from '@/lib/csv';
import type { Invoice } from '@/lib/mock/invoices';
import { DEFAULT_CURRENCY } from '@/lib/money';

export function useExportInvoices() {
  const t = useTranslations('Invoices');

  return (rows: Invoice[], name = 'invoices') => {
    if (rows.length === 0) return;

    const columns: CsvColumn<Invoice>[] = [
      { header: t('columns.number'), value: (i) => i.number },
      { header: t('columns.customer'), value: (i) => i.customer },
      { header: t('columns.issueDate'), value: (i) => i.issueDate },
      { header: t('columns.dueDate'), value: (i) => i.dueDate },
      { header: t('columns.total'), value: (i) => i.total },
      { header: t('columns.remaining'), value: (i) => i.remaining },
      { header: t('columns.currency'), value: () => DEFAULT_CURRENCY },
      { header: t('columns.status'), value: (i) => t(`status.${i.status}`) },
    ];

    const day = new Date().toISOString().slice(0, 10);
    downloadCsv(`${name}-${day}.csv`, columns, rows);
  };
}