// app/[locale]/(pages)/(dashboard)/audit-log/page.tsx
import { setRequestLocale } from 'next-intl/server';

import AuditLogView from '@/component/dashbord/audit-log/AuditLogView';

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuditLogView />;
}