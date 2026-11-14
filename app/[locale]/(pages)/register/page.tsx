// app/[locale]/(auth)/register/page.tsx
import Logo from '@/component/Logo';
import RegisterForm from '@/component/RegisterForm';
import RegisterShowcase from '@/component/RegisterShowcase';
import { getTranslations, setRequestLocale } from 'next-intl/server';


export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.register');

  return (
    <main className="bg-canvas px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="border-line bg-surface rounded-card mx-auto grid w-full max-w-6xl overflow-hidden border shadow-[0_24px_64px_-40px_rgba(15,42,32,0.4)] lg:min-h-155 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex flex-col bg-[#f1f7f3] px-5 py-6 sm:px-10 sm:py-8 lg:px-12 xl:px-16">
          <Logo />

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-10">
            <div className="rounded-card border-line bg-surface border p-5 shadow-[0_18px_48px_-32px_rgba(15,42,32,0.35)] sm:p-8">
              <h1 className="text-ink text-3xl leading-tight font-extrabold sm:text-4xl">
                {t('title')}
              </h1>
              <p className="text-body mt-3 text-sm leading-7 sm:text-base">
                {t('subtitle')}
              </p>
              <RegisterForm />
            </div>
          </div>
        </section>

        <RegisterShowcase />
      </div>
    </main>
  );
}