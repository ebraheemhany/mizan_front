// components/invoices/QuickActionsCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const outline =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 w-full text-sm font-bold';

export default function QuickActionsCard({
  canPay,
  canShare,
  onRecordPayment,
  onSendReminder,
  onCopyLink,
  onPreview,
  onViewEntry,
}: {
  canPay: boolean;
  canShare: boolean;
  onRecordPayment: () => void;
  onSendReminder: () => void;
  onCopyLink: () => void;
  onPreview: () => void;
  onViewEntry: () => void;
}) {
  const t = useTranslations('InvoiceDetail.quickActions');

  return (
    <section className="rounded-card border-line bg-surface border p-5 shadow-sm">
      <h2 className="text-ink text-base font-extrabold">{t('title')}</h2>

      <div className="mt-4 space-y-2.5">
        <Button
          disabled={!canPay}
          onClick={onRecordPayment}
          className="rounded-btn bg-brand hover:bg-brand/90 h-11 w-full text-sm font-bold text-white"
        >
          {t('recordPayment')}
        </Button>
        <Button
          variant="outline"
          disabled={!canPay}
          onClick={onSendReminder}
          className={outline}
        >
          {t('sendReminder')}
        </Button>
        <Button
          variant="outline"
          disabled={!canShare}
          onClick={onCopyLink}
          className={outline}
        >
          {t('copyLink')}
        </Button>
        <Button variant="outline" onClick={onPreview} className={outline}>
          {t('preview')}
        </Button>
        <Button variant="outline" onClick={onViewEntry} className={outline}>
          {t('viewEntry')}
        </Button>
      </div>
    </section>
  );
}
