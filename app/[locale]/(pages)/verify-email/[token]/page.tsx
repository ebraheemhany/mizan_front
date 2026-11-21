// app/[locale]/(pages)/verify-email/[token]/page.tsx
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts): the link may be opened on another device.
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import AuthCard from '@/component/AuthCard';
import RouteLoading from '@/component/RouteLoading';
import VerifyEmailView from '@/component/VerifyEmailView';

type Params = Promise<{ locale: string; token: string }>;

// The token in the URL is request data: read it inside Suspense (Cache Components).
export default function VerifyEmailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading fullScreen />}>
      <Verify params={params} />
    </Suspense>
  );
}

async function Verify({ params }: { params: Params }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  return (
    <AuthCard>
      <VerifyEmailView token={token} />
    </AuthCard>
  );
}
