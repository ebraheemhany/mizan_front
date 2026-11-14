// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cairo, Inter } from 'next/font/google';
import { routing, rtlLocales } from '@/i18n/routing';
import { QuotesProvider } from '@/component/dashbord/quotes/QuotesProvider';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      dir={rtlLocales.includes(locale) ? 'rtl' : 'ltr'}
      className={`${cairo.variable} ${inter.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QuotesProvider>{children}</QuotesProvider>
        </NextIntlClientProvider>
        <Toaster
          dir={rtlLocales.includes(locale) ? 'rtl' : 'ltr'}
          position="top-center"
          toastOptions={{ classNames: { toast: 'font-sans' } }}
        />
      </body>
    </html>
  );
}
