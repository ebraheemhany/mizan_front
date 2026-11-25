// component/desktop/DesktopDownloads.tsx
// The desktop app's download cards (Windows, macOS) with the first-install steps.
// Shown on the public /download page and on the app's own /desktop-app page.
'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Laptop, Monitor } from 'lucide-react';

import { cn } from '@/lib/utils';

// Each release (.github/workflows/desktop.yml) also uploads these fixed names, so
// "latest" always points at the newest version.
const RELEASES = 'https://github.com/ebraheemhany/mizan_front/releases/latest/download';

const PLATFORMS = [
  { key: 'windows', icon: Monitor, href: `${RELEASES}/Mizan-Windows-Setup.exe`, steps: ['windows1', 'windows2', 'windows3'] },
  { key: 'macos', icon: Laptop, href: `${RELEASES}/Mizan-macOS.dmg`, steps: ['macos1', 'macos2', 'macos3'] },
] as const;

type Platform = (typeof PLATFORMS)[number]['key'];

function detectPlatform(): Platform | null {
  const agent = navigator.userAgent;
  if (/Windows/i.test(agent)) return 'windows';
  if (/Macintosh/i.test(agent)) return 'macos';
  return null;
}

const noSubscription = () => () => {};

export default function DesktopDownloads() {
  const t = useTranslations('Desktop.download');
  // The visitor's own system (null on the server and on phones): marked as theirs.
  const mine = useSyncExternalStore(noSubscription, detectPlatform, () => null);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {PLATFORMS.map(({ key, icon: Icon, href, steps }) => (
        <section
          key={key}
          className={cn(
            'bg-surface rounded-card flex flex-col border p-6 shadow-sm sm:p-8',
            mine === key ? 'border-brand/40 ring-brand/10 ring-4' : 'border-line',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="bg-brand-soft text-brand flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-ink text-xl font-extrabold">{t(`${key}.name`)}</h2>
              <p className="text-muted text-sm">{t(`${key}.requirements`)}</p>
            </div>
            {mine === key && (
              <span className="bg-brand-soft text-brand-deep shrink-0 rounded-full px-2.5 py-1 text-xs font-bold">
                {t('yourDevice')}
              </span>
            )}
          </div>

          <a
            href={href}
            className="rounded-btn bg-brand hover:bg-brand/90 mt-6 flex h-12 items-center justify-center gap-2 font-bold text-white shadow-sm"
          >
            <Download className="size-4" aria-hidden="true" />
            {t(`${key}.button`)}
          </a>

          <h3 className="text-ink mt-6 text-sm font-extrabold">{t('firstTime')}</h3>
          <ol className="text-body marker:text-brand mt-2 list-decimal space-y-2 ps-5 text-sm leading-7">
            {steps.map((step) => (
              <li key={step}>
                {t.rich(`${key}.${step}`, {
                  // Names on the screen (buttons, files): kept apart so they read
                  // left to right inside Arabic text.
                  x: (chunks) => (
                    <bdi dir="ltr" className="text-ink font-semibold whitespace-nowrap">
                      {chunks}
                    </bdi>
                  ),
                })}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
