// component/desktop/DesktopAppView.tsx
// The "Desktop app" page inside Mizan: download it for Windows or macOS. Opened from
// the desktop app itself, it says so (with its version) above the downloads.
'use client';

import { useTranslations } from 'next-intl';
import { MonitorCheck, RefreshCw } from 'lucide-react';

import PageHeader from '@/component/PageHeader';
import DesktopDownloads from '@/component/desktop/DesktopDownloads';
import { useDesktopApp } from '@/lib/desktop';

export default function DesktopAppView() {
  const t = useTranslations('Desktop.download');
  const app = useDesktopApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {app && (
        <div role="status" className="bg-brand-soft/60 border-brand/15 text-body flex items-start gap-3 rounded-2xl border p-4 text-sm leading-7">
          <MonitorCheck className="text-brand mt-1 size-5 shrink-0" aria-hidden="true" />
          <p>{t('inApp', { version: app.version })}</p>
        </div>
      )}

      <DesktopDownloads />

      <p className="text-muted flex items-start gap-2 text-sm leading-7">
        <RefreshCw className="mt-1.5 size-4 shrink-0" aria-hidden="true" />
        {t('updates')}
      </p>
    </div>
  );
}
