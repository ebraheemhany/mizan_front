// app/[locale]/(pages)/invite/[token]/page.tsx
// Public (see PUBLIC_SECTIONS in lib/auth/constants.ts): the invited person has no account yet.
import InviteAcceptView from '@/component/InviteAcceptView';
import Logo from '@/component/Logo';
import { setRequestLocale } from 'next-intl/server';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-canvas min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <Logo />
        <div className="rounded-card border-line bg-surface mt-8 border p-5 shadow-[0_18px_48px_-32px_rgba(15,42,32,0.35)] sm:p-8">
          <InviteAcceptView token={token} />
        </div>
      </div>
    </main>
  );
}
