// app/[locale]/(pages)/(dashboard)/[section]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RouteLoading from '@/component/RouteLoading';
import { NAV_GROUPS } from '@/component/dashbord/nav-config';

type Params = Promise<{ locale: string; section: string }>;

// The section in the URL is request data: read it inside Suspense (Cache Components).
export default function DashboardSectionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <DashboardSection params={params} />
    </Suspense>
  );
}

async function DashboardSection({ params }: { params: Params }) {
  const { locale, section } = await params;
  const item = NAV_GROUPS.flat().find((navItem) => navItem.href === `/${section}`);

  if (!item) notFound();

  setRequestLocale(locale);
  const t = await getTranslations('Nav');

  return (
    <section className="border-line bg-surface rounded-xl border p-6 sm:p-8">
      <h1 className="text-ink text-2xl font-extrabold">{t(item.key)}</h1>
      <p className="text-body mt-2">{t('sectionComingSoon')}</p>
    </section>
  );
}
