'use client';

import { useTranslations } from 'next-intl';
import { downloadCsv, type CsvColumn } from '@/lib/csv';
import type { Payment } from '@/lib/mock/payments';
import { DEFAULT_CURRENCY } from '@/lib/money';

export function useExportPayments() {
  const t = useTranslations('Payments');

  return (rows: Payment[]) => {
    if (rows.length === 0) return;

    const columns: CsvColumn<Payment>[] = [
      { header: t('table.number'), value: (payment) => payment.number },
      { header: t('table.invoice'), value: (payment) => payment.invoiceNo },
      { header: t('table.customer'), value: (payment) => payment.customer },
      { header: t('table.date'), value: (payment) => payment.date },
      {
        header: t('table.method'),
        value: (payment) => t(`methods.${payment.method}`),
      },
      { header: t('table.amount'), value: (payment) => payment.amount },
      { header: t('form.fields.currency'), value: () => DEFAULT_CURRENCY },
      {
        header: t('form.fields.account'),
        value: (payment) =>
          payment.account ? t(`form.accounts.${payment.account}`) : '',
      },
      {
        header: t('form.fields.reference'),
        value: (payment) => payment.reference,
      },
      { header: t('form.fields.note'), value: (payment) => payment.note },
      {
        header: t('status.label'),
        value: (payment) => t(`status.${payment.status}`),
      },
    ];

    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`payments-${date}.csv`, columns, rows);
  };
}
