// app/[locale]/(pages)/(dashboard)/desktop-app/page.tsx
// Download the desktop app, from inside Mizan (the public page is /download).
import { setRequestLocale } from 'next-intl/server';

import DesktopAppView from '@/component/desktop/DesktopAppView';

export default async function DesktopAppPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <DesktopAppView />;
}
