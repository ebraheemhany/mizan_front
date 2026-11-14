// app/[locale]/(pages)/(dashboard)/accounts/page.tsx
import { setRequestLocale } from 'next-intl/server';

import AccountsView from '@/component/dashbord/accounts/AccountsView';

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccountsView />;
}
