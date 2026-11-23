// app/[locale]/(marketing)/terms/page.tsx
// Public (see PUBLIC_SECTIONS). Linked from the sign-up form and Google's consent screen.
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import LegalPage from '@/component/LegalPage';
import { LEGAL } from '@/lib/legal';

type Params = Promise<{ locale: string }>;
const docs = (locale: string) => (locale === 'en' ? LEGAL.en : LEGAL.ar);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: docs((await params).locale).terms.title };
}

export default async function TermsPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { privacy, terms } = docs(locale);
  return <LegalPage doc={terms} other={{ href: '/privacy', label: privacy.title }} />;
}
