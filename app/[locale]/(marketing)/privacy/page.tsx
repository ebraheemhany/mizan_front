// app/[locale]/(marketing)/privacy/page.tsx
// Public (see PUBLIC_SECTIONS). Google's consent screen links here.
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import LegalPage from '@/component/LegalPage';
import { LEGAL } from '@/lib/legal';

type Params = Promise<{ locale: string }>;
const docs = (locale: string) => (locale === 'en' ? LEGAL.en : LEGAL.ar);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: docs((await params).locale).privacy.title };
}

export default async function PrivacyPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { privacy, terms } = docs(locale);
  return <LegalPage doc={privacy} other={{ href: '/terms', label: terms.title }} />;
}
