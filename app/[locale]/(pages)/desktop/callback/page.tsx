// app/[locale]/(pages)/desktop/callback/page.tsx
// Inside the desktop app: where it lands with the sign-in code the browser handed it.
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts).
import { setRequestLocale } from 'next-intl/server';
import AuthCard from '@/component/AuthCard';
import DesktopCallbackView from '@/component/desktop/DesktopCallbackView';

export default async function DesktopCallbackPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    <AuthCard>
      <DesktopCallbackView />
    </AuthCard>
  );
}
