// app/[locale]/(pages)/forgot-password/page.tsx
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts).
import { setRequestLocale } from 'next-intl/server';
import AuthCard from '@/component/AuthCard';
import ForgotPasswordForm from '@/component/ForgotPasswordForm';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    <AuthCard>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
