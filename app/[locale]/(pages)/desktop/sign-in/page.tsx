// app/[locale]/(pages)/desktop/sign-in/page.tsx
// Opened by the desktop app in the computer's browser to sign in with Google there.
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts).
import { setRequestLocale } from 'next-intl/server';
import AuthCard from '@/component/AuthCard';
import DesktopSignInView from '@/component/desktop/DesktopSignInView';

export default async function DesktopSignInPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    <AuthCard>
      <DesktopSignInView />
    </AuthCard>
  );
}
