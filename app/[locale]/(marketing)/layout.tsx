// app/[locale]/(marketing)/layout.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/component/Header';
import Footer from '@/component/Footer';
import ScrollReveal from '@/component/ScrollReveal';
import { REFRESH_COOKIE } from '@/lib/auth/constants';

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
      {/* Who is visiting is request data: only the header waits for it, the page stays static. */}
      <Suspense fallback={<Header signedIn={null} />}>
        <HeaderForVisitor />
      </Suspense>
      {children}
      <Footer />
      {/* Brings the sections in as they scroll into view. */}
      <ScrollReveal />
    </>
  );
}

/**
 * Signed in or not, from the session cookie (as proxy.ts decides redirects): someone
 * signed in gets "Go to dashboard" instead of "Log in" and "Get started".
 */
async function HeaderForVisitor() {
  const signedIn = (await cookies()).has(REFRESH_COOKIE);
  return <Header signedIn={signedIn} />;
}
