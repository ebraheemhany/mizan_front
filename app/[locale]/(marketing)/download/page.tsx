// app/[locale]/(marketing)/download/page.tsx
// The desktop app (desktop/ in this repo) for Windows and macOS.
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Download, Laptop, Monitor, RefreshCw } from 'lucide-react';

type Params = Promise<{ locale: string }>;

// Each release (.github/workflows/desktop.yml) also uploads these fixed names, so
// "latest" always points at the newest version.
const RELEASES = 'https://github.com/ebraheemhany/mizan_front/releases/latest/download';
const DOWNLOADS = {
  windows: `${RELEASES}/Mizan-Windows-Setup.exe`,
  macos: `${RELEASES}/Mizan-macOS.dmg`,
} as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: 'Desktop.download' });
  return { title: t('metaTitle') };
}

export default async function DownloadPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Desktop.download');

  const platforms = [
    { key: 'windows', icon: Monitor, href: DOWNLOADS.windows, steps: ['windows1', 'windows2', 'windows3'] },
    { key: 'macos', icon: Laptop, href: DOWNLOADS.macos, steps: ['macos1', 'macos2', 'macos3'] },
  ] as const;

  return (
    <main className="bg-canvas px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{t('title')}</h1>
          <p className="text-body mx-auto mt-4 max-w-2xl leading-8">{t('subtitle')}</p>
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {platforms.map(({ key, icon: Icon, href, steps }) => (
            <section key={key} className="border-line bg-surface rounded-card flex flex-col border p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="bg-brand-soft text-brand flex size-12 items-center justify-center rounded-2xl">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-ink text-xl font-extrabold">{t(`${key}.name`)}</h2>
                  <p className="text-muted text-sm">{t(`${key}.requirements`)}</p>
                </div>
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

        <p className="text-muted mt-8 flex items-start justify-center gap-2 text-center text-sm leading-7">
          <RefreshCw className="mt-1.5 size-4 shrink-0" aria-hidden="true" />
          {t('updates')}
        </p>
      </div>
    </main>
  );
}
