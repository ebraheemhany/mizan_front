// app/[locale]/(pages)/reset-password/[token]/page.tsx
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts): opened from the "forgot password" email.
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import AuthCard from '@/component/AuthCard';
import ResetPasswordView from '@/component/ResetPasswordView';
import RouteLoading from '@/component/RouteLoading';

type Params = Promise<{ locale: string; token: string }>;

// The token in the URL is request data: read it inside Suspense (Cache Components).
export default function ResetPasswordPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading fullScreen />}>
      <Reset params={params} />
    </Suspense>
  );
}

async function Reset({ params }: { params: Params }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  return (
    <AuthCard>
      <ResetPasswordView token={token} />
    </AuthCard>
  );
}
