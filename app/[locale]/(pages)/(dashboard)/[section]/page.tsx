import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { NAV_GROUPS } from '@/component/dashbord/nav-config';

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  const item = NAV_GROUPS.flat().find(
    (navItem) => navItem.href === `/${section}`,
  );

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
