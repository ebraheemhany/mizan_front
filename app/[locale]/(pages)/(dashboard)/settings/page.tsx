// app/[locale]/(pages)/(dashboard)/settings/page.tsx
import SettingsView from '@/component/dashbord/settings/SettingsView';
import { setRequestLocale } from 'next-intl/server';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsView />;
}
