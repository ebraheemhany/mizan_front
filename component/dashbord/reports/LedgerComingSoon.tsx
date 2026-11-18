// component/dashbord/reports/LedgerComingSoon.tsx
'use client';

import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Balance sheet and cash flow need a general ledger, which doesn't exist yet: no made-up numbers. */
export default function LedgerComingSoon() {
  const t = useTranslations('Reports');
  const tApi = useTranslations('ReportsApi');

  return (
    <div className="rounded-card border-line bg-surface flex flex-col items-center gap-3 border px-5 py-14 text-center shadow-sm">
      <BookOpen className="text-muted size-6" />
      <p className="text-ink text-sm font-extrabold">{t('comingSoon')}</p>
      <p className="text-muted max-w-sm text-xs leading-5">{tApi('ledgerHint')}</p>
    </div>
  );
}
