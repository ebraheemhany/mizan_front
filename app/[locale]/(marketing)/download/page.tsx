// app/[locale]/(marketing)/download/page.tsx
// The desktop app (desktop/ in this repo) for Windows and macOS. Signed-in people
// also have it inside the app, at /desktop-app.
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RefreshCw } from 'lucide-react';

import DesktopDownloads from '@/component/desktop/DesktopDownloads';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: 'Desktop.download' });
  return { title: t('metaTitle') };
}

export default async function DownloadPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Desktop.download');

  return (
    <main className="bg-canvas px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{t('title')}</h1>
          <p className="text-body mx-auto mt-4 max-w-2xl leading-8">{t('subtitle')}</p>
        </header>

        <DesktopDownloads />

        <p className="text-muted mt-8 flex items-start justify-center gap-2 text-center text-sm leading-7">
          <RefreshCw className="mt-1.5 size-4 shrink-0" aria-hidden="true" />
          {t('updates')}
        </p>
      </div>
    </main>
  );
}
