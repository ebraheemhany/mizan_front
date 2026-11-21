// app/[locale]/(marketing)/layout.tsx
import { setRequestLocale } from 'next-intl/server';
import Header from '@/component/Header';
import Footer from '@/component/Footer';
import ScrollReveal from '@/component/ScrollReveal';

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Lets the header and footer render statically (otherwise next-intl reads the request).
  setRequestLocale((await params).locale);
  return (
    <>
      <Header />
      {children}
      <Footer />
      {/* Brings the sections in as they scroll into view. */}
      <ScrollReveal />
    </>
  );
}
